from PIL import Image, ImageDraw
import os, glob
files = sorted(glob.glob("assets/cans/clean/*.png"))
cols=5; cell=240; pad=10; rows=(len(files)+cols-1)//cols
W=cols*cell; H=rows*cell
sheet=Image.new("RGBA",(W,H),(10,1,3,255))
d=ImageDraw.Draw(sheet)
for i,f in enumerate(files):
    im=Image.open(f).convert("RGBA")
    s=min((cell-2*pad)/im.width,(cell-2*pad-18)/im.height)
    im=im.resize((int(im.width*s),int(im.height*s)))
    cx=(i%cols)*cell; cy=(i//cols)*cell
    sheet.alpha_composite(im,(cx+(cell-im.width)//2, cy+pad))
    d.text((cx+8,cy+cell-16), os.path.basename(f), fill=(255,255,255,255))
sheet.convert("RGB").save("scripts/contact.png")
print("saved", sheet.size, len(files),"cans")
