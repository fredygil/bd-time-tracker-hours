const puppeteer = require('puppeteer-extra')
const fs = require('fs');
const dotenv = require('dotenv');

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

dotenv.config();
const TT_URL = 'https://timetracker.bairesdev.com';

const login = async (page) => {
    if (!process.env.TT_USERNAME) {
        console.error('TT_USERNAME environment variable is not defined');
        return { status: 'error', error: 'TT_USERNAME environment variable is not defined' }
    }
    if (!process.env.TT_PASSWORD) {
        console.error('TT_PASSWORD environment variable is not defined');
        return { status: 'error', error: 'TT_PASSWORD environment variable is not defined' }
    }
    try {
        await page.type('#ctl00_ContentPlaceHolder_UserNameTextBox', process.env.TT_USERNAME);
        await page.type('#ctl00_ContentPlaceHolder_PasswordTextBox', process.env.TT_PASSWORD);
        await page.click('#ctl00_ContentPlaceHolder_LoginButton');
        return { status: 'ok' }
    } catch (e) {
        console.error(e);
        return { status: 'error', error: e }
    }
}

const searchOption = async (page, selector, text) => {
    const options = await page.$$eval(`${selector} option`, options => options.map(option => ({ text: option.text, value: option.value })));
    const resultOption = options.find(option => option.text === text);
    return resultOption ? resultOption.value : null;
};

const assignSelectValueFromText = async (page, selector, text) => {
    await page.waitForSelector(selector);
    const value = await searchOption(page, selector, text);
    if (value) {
        await page.select(selector, value);
    }
}

const trackHours = async (page, line) => {
    if (line && line.length > 0) {
        try {
            const [date, project, hours, taskCategory, taskDescription, comments, focalPoint] = line;
            if (date && project && hours && taskCategory && taskDescription && focalPoint) {
                // Open Track Hours link
                await page.goto(`${TT_URL}/TimeTrackerAdd.aspx`);

                // Fill form fields
                // Clear date field before assigning a new value
                await page.evaluate(() => document.getElementById("ctl00_ContentPlaceHolder_txtFrom").value = "")
                await page.type('#ctl00_ContentPlaceHolder_txtFrom', date);
                await page.type('#ctl00_ContentPlaceHolder_TiempoTextBox', hours);
                await page.type('#ctl00_ContentPlaceHolder_CommentsTextBox', comments);
                // Dropdown selects
                await assignSelectValueFromText(page, '#ctl00_ContentPlaceHolder_idProyectoDropDownList', project);
                // Wait until the dropdown is filled
                await page.waitForTimeout(500);
                await assignSelectValueFromText(page, '#ctl00_ContentPlaceHolder_idFocalPointClientDropDownList', focalPoint);
                await assignSelectValueFromText(page, '#ctl00_ContentPlaceHolder_idCategoriaTareaXCargoLaboralDropDownList', taskCategory);
                // Wait until the dropdown is filled
                await page.waitForTimeout(500);
                await assignSelectValueFromText(page, '#ctl00_ContentPlaceHolder_idTareaXCargoLaboralDownList', taskDescription);

                // Submit
                await page.click('#ctl00_ContentPlaceHolder_btnAceptar');
                await page.waitForNavigation();
            }
            return { status: 'ok' }
        } catch (e) {
            console.error(e);
            return { status: 'error', error: e }
        }
    }
};

const processTrackData = async (page, filePath) => {
    // Open the file
    try {
        const fileData = fs.readFileSync(filePath, 'utf8');
        const fileRecords = fileData.split('\n');
        for (let i = 0; i < fileRecords.length; i++) {
            await trackHours(page, fileRecords[i].split('\t'));
        }
        return { status: 'ok' }
    } catch (e) {
        console.error(e);
        return { status: 'error', error: e }
    }
};

(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });

    // Open time tracker page
    const page = await browser.newPage();
    await page.goto(TT_URL);
    ;

    // Give time to cloudflare to validate the page
    await page.waitForTimeout(5000);
    // Log in with credentials in environment
    const result = await login(page);
    if (result.status === 'ok') {
        // Waits until navigates to next page
        await page.waitForNavigation();

        // Process file with data to track
        await processTrackData(page, process.argv[2] || '');
    }

    // Close
    await page.waitForTimeout(1000);
    await browser.close();
})();