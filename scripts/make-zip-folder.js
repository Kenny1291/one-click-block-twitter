//@ts-ignore
import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'

async function addFile(zip, filePath) {
    const data = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    zip.file(fileName, data)
}

async function addFolder(zip, folderPath) {
    const files = fs.readdirSync(folderPath)
    const folderName = path.basename(folderPath)
    const folder = zip.folder(folderName)
    for (const file of files) {
        const filePath = path.join(folderPath, file)
        if (fs.statSync(filePath).isDirectory()) {
            await addFolder(folder, filePath)
        } else {
            await addFile(folder, filePath)
        }
    }
}

export async function createZip(files, folders) {
    const zip = new JSZip()

    for (const file of files) {
        await addFile(zip, file)
    }
    for (const folder of folders) {
        await addFolder(zip, folder)
    }

    zip.generateAsync({ type: 'nodebuffer' }).then(content => {
        fs.writeFileSync('dist/one-click-block-twitter.zip', content)
    })
}

export const filesToAdd = ['manifest.json', 'src/content.js']
export const foldersToAdd = ['src/images']

