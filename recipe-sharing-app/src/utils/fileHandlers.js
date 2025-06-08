import fs from 'fs';
import path from 'path';

// Function to handle file uploads
export const uploadFile = (file, uploadDir) => {
    const filePath = path.join(uploadDir, file.name);
    return new Promise((resolve, reject) => {
        fs.copyFile(file.path, filePath, (err) => {
            if (err) {
                return reject(err);
            }
            resolve(filePath);
        });
    });
};

// Function to delete a file
export const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                return reject(err);
            }
            resolve(true);
        });
    });
};

// Function to read a file
export const readFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
};