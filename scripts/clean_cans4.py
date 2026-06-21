from collections import deque
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage

def whiteish(rgb,a,tol):
    return (np.sqrt(((255-rgb.astype(np.int16))**2).sum(axis=2))<=tol)&(a>0)
def floodfill_bg(im,tol):
    arr=np.array(im); h,w=arr.shape[:2]; rgb=arr[:,:,:3]; a=arr[:,:,3]
    mask=whiteish(rgb,a,tol); vis=np.zeros((h,w),bool); dq=deque()
    for x in range(w):
        for y in (0,h-1):
            if mask[y,x] and not vis[y,x]: vis[y,x]=True; dq.append((y,x))
    for y in range(h):
        for x in (0,w-1):
            if mask[y,x] and not vis[y,x]: vis[y,x]=True; dq.append((y,x))
    while dq:
        y,x=dq.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=y+dy,x+dx
            if 0<=ny<h and 0<=nx<w and not vis[ny,nx] and mask[ny,nx]: vis[ny,nx]=True; dq.append((ny,nx))
    arr[:,:,3][vis]=0
    return Image.fromarray(arr,'RGBA')
def edge_clean(img, erode=1, feather=0.7):
    arr=np.array(img); a=arr[:,:,3]; mask=a>40
    if erode>0: mask=ndimage.binary_erosion(mask, iterations=erode)
    arr[:,:,3]=np.where(mask, a, 0).astype(np.uint8)
    out=Image.fromarray(arr,'RGBA'); al=out.split()[3].filter(ImageFilter.GaussianBlur(feather)); out.putalpha(al); return out
def autocrop(img, pad=12):
    bb=img.getbbox()
    if not bb: return img
    bb=(max(0,bb[0]-pad),max(0,bb[1]-pad),min(img.width,bb[2]+pad),min(img.height,bb[3]+pad)); return img.crop(bb)

def extract(src,dst,tol=82):
    im=Image.open(src).convert('RGBA'); w,h=im.size
    img=floodfill_bg(im,tol)
    colh=(np.array(img)[:,:,3]>40).sum(axis=0)
    xr=w-1
    while xr>0 and colh[xr]<0.05*h: xr-=1
    canmax=int(colh[max(0,xr-220):xr+1].max())
    thr=0.62*canmax
    cnt=0; low_start=None; xl=0
    x=xr
    while x>0:
        if colh[x]<thr:
            if cnt==0: low_start=x
            cnt+=1
            if cnt>=25: xl=low_start+1; break
        else: cnt=0; low_start=None
        x-=1
    arr=np.array(img); arr[:, :max(0,xl-1), 3]=0
    crop=Image.fromarray(arr,'RGBA').crop((max(0,xl-1),0,min(w,xr+3),h))
    crop=edge_clean(crop); crop=autocrop(crop)
    crop.save(dst); print(f"OK {dst} size={crop.size} (canmax={canmax}, xl={xl}, xr={xr})")

for name,src in [('cola','pack-cola'),('cola-zero','pack-cola-zero'),('lemon','pack-lemon'),
                 ('pomme','pack-pomme'),('cerise','pack-cerise'),('mangue','pack-mangue')]:
    extract(f"assets/cans/{src}.png", f"assets/cans/clean/{name}.png")
extract("assets/cans/cherry-alt.png","assets/cans/clean/cola-cherry.png")
