const { readdirSync } = require('fs');
const fs = require('fs');
const { hideBin } = require('yargs/helpers');
var argv = require('yargs/yargs')(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .example('$0 --input "C://Input" --output "C://Output"')
  .version(false)
  .option('inputPath', {
    describe: 'Path to the Input folder',
    type: 'string',
    // demandOption: true,
  })
  .option('outputPath', {
    describe: 'Path to the Output folder',
    type: 'string',
    // demandOption: true,
  })
  .option('skip', {
    describe: 'How many images to skip for every processed included',
    type: 'number',
  })
  .option('startHour', {
    describe: 'Starting hour to filter based on time interval',
    type: 'number',
  })
  .option('endHour', {
    describe: 'End hour to filter based on time interval',
    type: 'number',
  })
  .epilog('MXessories 2021').argv;

const inputPath = argv.inputPath ? argv.inputPath : '../test';
const outputPath = argv.outputPath ? argv.outputPath : '../output';
const skip = argv.skip ? parseInt(argv.skip) + 1 : 1;
const startHour = argv.startHour ? parseInt(argv.startHour) : 0;
const endHour = argv.endHour ? parseInt(argv.endHour) : 24;

try {
  console.log('Input folder: ' + inputPath);
  console.log('Output folder: ' + outputPath);
  console.log('Skip: ' + (parseInt(skip) - 1).toString());
  console.log('Start hour: ' + startHour);
  console.log('End hour: ' + endHour);
  console.log('Processing...');

  let nrOfFilesCopied = 0;
  let nrOfErrors = 0;
  let nrOfSkipped = 0;
  let step = 1;

  let level1Dirs = readdirSync(inputPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort((a, b) => parseInt(a) - parseInt(b));

  level1Dirs.forEach((lv1Dir) => {
    let level2Dirs = readdirSync(inputPath + '/' + lv1Dir, {
      withFileTypes: true,
    })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .sort((a, b) => parseInt(a) - parseInt(b));

    level2Dirs.forEach((lv2Dir) => {
      let lv2DirFullPath = inputPath + '/' + lv1Dir + '/' + lv2Dir;
      let date = extractDate(lv2DirFullPath);

      let newFileName =
        date.getFullYear() +
        '-' +
        date.getMonth().toString().padStart(2, '0') +
        '-' +
        date.getDay().toString().padStart(2, '0') +
        '_' +
        date.getHours().toString().padStart(2, '0') +
        '-' +
        date.getMinutes().toString().padStart(2, '0') +
        '-' +
        date.getSeconds().toString().padStart(2, '0') +
        '.jpg';

      if (
        step % skip == 0 &&
        date.getHours() >= startHour &&
        date.getHours() <= endHour
      ) {
        try {
          console.log(
            'Processing ' + lv1Dir + '/' + lv2Dir + ': ' + newFileName
          );
          fs.copyFile(
            lv2DirFullPath + '/E00000.jpg',
            outputPath + '/' + newFileName,
            (err) => {
              if (err) throw err;
            }
          );
          nrOfFilesCopied++;
        } catch (error) {
          console.log('Error on folder ' + lv2DirFullPath);
          nrOfErrors++;
        }
      } else {
        console.log('Skipping   ' + lv1Dir + '/' + lv2Dir + ': ' + newFileName);
        nrOfSkipped++;
      }
      step++;
    });
  });

  console.log('Done');
  console.log(nrOfFilesCopied.toString() + ' files copied');
  console.log(nrOfSkipped.toString() + ' files skipped');
  console.log(nrOfErrors.toString() + ' errors');
} catch (error) {
  console.log('An ERROR occured. Use --help for instructions.');
}

function extractDate(dirPath) {
  let fullText = fs.readFileSync(dirPath + '/E00000.jpg', {
    encoding: 'UTF-8',
  });

  var meta = fullText.substring(
    fullText.indexOf('SECTION FINGERPRINT'),
    fullText.indexOf('ENDSECTION EVENT')
  );
  let lines = meta.split('\n');
  let rawDate = lines.find((l) => l.startsWith('DAT')).replace('DAT=', '');
  let rawTime = lines
    .find((l) => l.startsWith('TIM'))
    .replace('TIM=', '')
    .split('.')[0];
  return new Date(
    rawDate.split('-')[0],
    rawDate.split('-')[1],
    rawDate.split('-')[2],
    rawTime.split(':')[0],
    rawTime.split(':')[1],
    rawTime.split(':')[2]
  );
}
