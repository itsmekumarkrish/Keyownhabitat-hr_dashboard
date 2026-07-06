const Jimp = require('jimp');

async function processFavicon() {
  try {
    const image = await Jimp.read('New Logo_Round_2026-07-06_at_16.16.48-removebg-preview.png');
    
    // Find true bounding box of the symbol to remove all transparent padding
    let minX = image.bitmap.width, minY = image.bitmap.height, maxX = 0, maxY = 0;
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(sx, sy, idx) {
        const alpha = this.bitmap.data[idx + 3];
        if (alpha > 5) { // threshold for non-transparent
            minX = Math.min(minX, sx);
            minY = Math.min(minY, sy);
            maxX = Math.max(maxX, sx);
            maxY = Math.max(maxY, sy);
        }
    });
    
    const cropW = maxX - minX;
    const cropH = maxY - minY;
    
    // Crop it tight to the visible pixels
    image.crop(minX, minY, cropW, cropH);
    
    // Make it perfectly square again by padding it slightly
    const newSize = Math.max(cropW, cropH) + Math.floor(Math.max(cropW, cropH) * 0.05); // add 5% padding
    
    const squareImg = new Jimp(newSize, newSize, 0x00000000); // transparent
    const pasteX = Math.floor((newSize - cropW) / 2);
    const pasteY = Math.floor((newSize - cropH) / 2);
    
    squareImg.composite(image, pasteX, pasteY);
    
    // Resize and save
    const fav32 = squareImg.clone().resize(32, 32);
    await fav32.writeAsync('favicon-32x32.png');
    
    const fav192 = squareImg.clone().resize(192, 192);
    await fav192.writeAsync('favicon-192x192.png');
    
    console.log("Successfully auto-cropped and generated huge favicons!");
  } catch(e) {
    console.error(e);
  }
}

processFavicon();
