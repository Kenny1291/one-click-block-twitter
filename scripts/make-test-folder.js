import fs from 'fs-extra'
import path from 'path'

export const filesToAdd = ['manifest.json', 'src/content.js']

const destinationFolder = 'dist/one-click-block-twitter/'

/**
 * @param {string} fileOrFolder
 */
async function copyToDestDir(fileOrFolder) {
    const fileName = path.basename(fileOrFolder)
    await fs.copy(fileOrFolder, destinationFolder + fileName)
}

export async function make() {
    for (const file of filesToAdd) {
        await copyToDestDir(file)
    } 
}
