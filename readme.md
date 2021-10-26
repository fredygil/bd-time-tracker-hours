# Upload Time Tracker Hours

This utility allow users to upload Time Tracker hours from a text file.

## Why?

If you think for you it's easier to keep your worked hours in a spreadsheet than filling the same form several times in the current Web app, then you'll find this tool helpful. 

## Requirements

Since this is a **Node.js** project, you need to [download and install Node](https://nodejs.org/) first.

## Step by step

### Clone this repository

```sh
git clone https://github.com/fredygil/bd-time-tracker-hours.git
```

### Install dependencies

```sh
cd bd-time-tracker-hours
npm install
```

### Copy hours record to text file

You need to keep track of your worked hours in a spreadsheet (well, you can do it directly in the text file but this way is easier) and then copy the data to a text file (without headers). In the spreadsheet you need to fill the cells using the same data you would fill in the Time Tracker Web app form, paying a lot of attention to upper/lower case words for caregories. Once the spreadsheet is filled, copy the desired rows to a text file and save it to the local disk.

You can [download the Time Tracker Template here](
https://docs.google.com/spreadsheets/d/1VWGUeW7Q-D3K75OR09BTKS-fIvL9ckw3mCEDyTiOBkk/edit?usp=sharing).


### Create a .env file

This needs to be done just once. Inside the `bd-time-tracker-hours` folder, create a `.env` file with this format, but using your real username and password:

```
TT_USERNAME=john.doe
TT_PASSWORD=JOHNDOE123
```

### Run track.js script with node

The `track.js` script reads the text file you created above and uploads the data to your Time Tracker. Behind the scenes, it just open a Chrome browser, login with your username and password and then track hours record by record, but it's faster than doing it manually. The script requires one parameter and it is the path of the text file, so replace `/PATH/TO/YOUR/TXT/FILE` whith the real path of your file.

```sh
cd bd-time-tracker-hours
node track.js /PATH/TO/YOUR/TXT/FILE
```

## Help

You have doubts or need extra help? Feel free to reach me out at [cesar.mejia@bairesdev.com](cesar.mejia@bairesdev.com) or just ping me in Slack (preferred method), search me as Cesar Fredy Gil Mejia.

## Contributions

This is intended to be a temporary tool, a better solution is on the way (delivered by the company), but if you want to make a contribution then it's welcome!