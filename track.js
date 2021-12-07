const puppeteer = require('puppeteer');
const fs = require('fs');
const dotenv = require('dotenv');

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
    //console.log(options);
    //console.log(text);
    const resultOption = options.find(option => option.text.includes(text));
    //console.log(resultOption);
    return resultOption ? resultOption.value : null;
};

const assignSelectValueFromText = async (page, selector, text) => {
    await page.waitForSelector('select'+selector+':not([disabled])'); 
    const value = await searchOption(page, selector, text);
    if (value) {
        await page.select(selector, value);
    }
}

const assignSelectFromValue = async (page, selector, value) => {
    //await page.select(selector, value);
	await page.click(selector);
	await page.waitFor(100);
	for(let j = 0; j < value; j++)
		await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
}

const trackHours = async (page, i, line) => {
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
                await assignSelectValueFromText(page, '#ctl00_ContentPlaceHolder_idCategoriaTareaXCargoLaboralDropDownList', taskCategory);
                // Wait until the dropdown is filled
                await page.waitForTimeout(850);
                await assignSelectValueFromText(page, '#ctl00_ContentPlaceHolder_idTareaXCargoLaboralDownList', taskDescription);
                // Wait until the dropdown is filled
                if (i == 0) {
					await page.waitForTimeout(100);
					await assignSelectFromValue(page, '#ctl00_ContentPlaceHolder_idFocalPointClientDropDownList', focalPoint);
                }
				await page.waitForTimeout(100);
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
            await trackHours(page, i, fileRecords[i].split('\t'));
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

    // Log in with credentials in environment
    const result = await login(page);
    if (result.status === 'ok') {
        // Waits until navigates to next page
        await page.waitForNavigation();

        // Process file with data to track
        await processTrackData(page, process.argv[2] || '');
    }

    // Close
    await page.waitForTimeout(1500);
    await browser.close();
})();