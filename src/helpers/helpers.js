const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../db/data.json');
const DATA_FILE_TWO = path.join(__dirname, '../db/session.json');

// Other routes

const linksData = async () => {
    let linksData = await loadData();
    return linksData;
}

const loadData = async () => {
    try {
        const dataString = await fs.readFileSync(DATA_FILE, 'utf8');
        return await JSON.parse(dataString);
    } catch (error) {
        console.error('Error get data:', error.message);
        return [];
    }
}

const saveData = async (data) => {
    try {
        await fs.writeFileSync(DATA_FILE, JSON.stringify(data), 'utf8');
    } catch (error) {
        console.error('Error to save data: ', error.message);
    }
}

const loadDataAuth = async () => {
    try {
        const dataString = await fs.readFileSync(DATA_FILE_TWO, 'utf8');
        return await JSON.parse(dataString);
    } catch (error) {
        console.error('Error get data:', error.message);
        return [];
    }
}


const saveDataAuth = async (data) => {
    try {
        await fs.writeFileSync(DATA_FILE_TWO, JSON.stringify(data), 'utf8');
    } catch (error) {
        console.error('Error to save data: ', error.message);
    }
}


let ipsData = loadDataAuth();

const deleteDataAuth = async (clientIP) => {
    try {
        ipsData = ipsData.filter(link => link !== clientIP);
        await saveDataAuth(ipsData);
    } catch (error) {
        console.error('Error to delete data: ', error.message);
    }
}

module.exports = { loadData, saveData, loadDataAuth, saveDataAuth, deleteDataAuth, linksData };