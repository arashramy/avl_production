
const path = require("path");
const moment = require("moment");
const cron = require("node-cron");
const { promises: fs } = require("fs");
const { execSync: exec } = require("child_process");
var shell = require("shelljs");

const { log } = require("debug");
const { db } = require("../DB/DbConnection");
const GPSDataModel = require("../model/GpsLocation/GPSDataModel");
const VehicleModel = require("../model/GpsLocation/VehicleModel");
// const { logger } = require('../utility/customlog.js');
// const { GPSDataModel, VehicleModel } = require('../models/gpslocation');

// console.log("removeOldGPSData ramy4")

const backupOptions = {
  removeOldBackups: true,
  latestMonthlyBackupsToKeep: 2,
  latestWeeklyBackupsToKeep: 4,
  backupDir: path.resolve(__dirname, "..", "db-backups"),
};

class DatabaseBackupCron {
  static async removeOldGPSData(expirationDate) {

    //  ------- delete gps data for before 9 months ago -------
    try {
      const vehicleLastLocations = (
        await VehicleModel.find().select("lastLocation")
      ).map((item) => item.lastLocation)
        console.log("|||||||||||========>",vehicleLastLocations)
      // console.log(vehicleLastLocations,"ramy")
      const oldGPSDataQuery = await GPSDataModel.deleteMany({
        _id: { $nin: vehicleLastLocations },
        date: { $lte: expirationDate },
      });
    } catch (error) {
      console.log(error);
    }
  }

  static async removeOldData() {
    console.log("removeOldGPSData ramy 6")

    const timePoint = new Date();
    timePoint.setHours(0, 0, 0);
    timePoint.setMonth(new Date().getMonth() - 9, 1); // Last 9 Month

    await DatabaseBackupCron.removeOldGPSData(timePoint).catch(
      console.log("something went wrong in removeOldData")
    );
  }

  static async removeOldDatabaseBackups() {
    // console.log("removeOldGPSData ramy 8")

    // ------- delete old backups -------
    const { latestMonthlyBackupsToKeep, latestWeeklyBackupsToKeep, backupDir } =
      backupOptions;
    const oldBackups = await fs.readdir(backupDir);
    let lastBackupDate;
    const toBeRemovedBackups = oldBackups
      .sort()
      .reverse()
      .filter((backup) => {
        const dateMatch = backup.match(/(?<date>\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const backupDate = new Date(dateMatch.groups.date);
          if (!lastBackupDate) {
            lastBackupDate = backupDate;
          }
          const backupAge = moment.duration(lastBackupDate - backupDate);
          const WeeklyBackupLifeDuration = moment.duration(
            latestWeeklyBackupsToKeep,
            "weeks"
          );
          const monthlyBackupLifeDuration = moment.duration(
            latestMonthlyBackupsToKeep,
            "months"
          );
          return !(
            backupAge < WeeklyBackupLifeDuration ||
            (backupAge < monthlyBackupLifeDuration && backupDate.getDate() <= 7)
          );
        }
        return false;
      });
    toBeRemovedBackups.forEach((fileName) => {
      // The fs.unlink() method is used to remove a file or symbolic link from the filesystem.
      fs.unlink(path.resolve(backupDir, fileName)).catch((e) =>
        // logger.error(e)
        console.log(e)
      );
    });
  }

  static async backupDatabase() {
try{
    const today = new Date();
    const { backupDir } = backupOptions;
    const backupName = moment(today).format("YYYY-MM-DD");

    const backupPath = path.resolve(backupDir, backupName);
  
    const databases = db.base.connections.map((connection) => connection.name);
    console.log(databases,"databases")
    // console.log(db,"db ********************************************")

    // console.log(db.base.connections,"db.connections ********************************************")

    const commands = databases
      .map(
        (database) =>
          `mongodump --host ${db.host} --port ${db.port} --db ${database} --out ${backupPath}`
      )
      .concat([
        `tar cfj ${backupPath}.tar.bz2 -C ${backupPath} ../${backupName}`,
        // `rm -r ${backupPath}`,
      ]);
    try {
      console.log(commands, "commands");
      // console.log(commands.join(' && '),"commands.join(' && ')")
      var stringCommand = commands.join(" && ");

      shell.exec(  'mongodump --host 127.0.0.1 --port 27017 --db AVL-RAMY --out C:\\Users\\ar-rahimi\\Desktop\\avl-server-master\\ramy\\avl-server-ramy\\db-backups\\2024-01-28',
      'tar cfj C:\\Users\\ar-rahimi\\Desktop\\avl-server-master\\ramy\\avl-server-ramy\\db-backups\\2024-01-28.tar.bz2 -C C:\\Users\\ar-rahimi\\Desktop\\avl-server-master\\ramy\\avl-server-ramy\\db-backups\\2024-01-28 ../2024-01-28');

      // await exec(commands.join(' && '));
      // logger.info('Database backup file generated successfully.', {
      //     date: today,
      // });
    } catch (error) {
      // logger.error(error);]
      console.log(error)
    }
  }catch(err){
  console.log(err,"err")

  }
  }

  static run() {
    // console.log("654123" )

    // const EVERY_WEEK_ON_FRIDAY_3_AM = "1 * * * *"; // 3 AM every week on Thursday
    // cron.schedule(EVERY_WEEK_ON_FRIDAY_3_AM, () => {
      (() => {
      try {
        // console.log(DatabaseBackupCron,"DatabaseBackupCron")
        DatabaseBackupCron.removeOldData().then(() => {
          DatabaseBackupCron.backupDatabase().then(() => {
            const { removeOldBackups } = backupOptions;
            if (removeOldBackups) {
              // console.log(removeOldBackups,"ok------------------------------------------")
              DatabaseBackupCron.removeOldDatabaseBackups().catch((e) =>
                // logger.error(e)
                console.log(e)
              );
            }
          });
        });
      } catch (err) {
        console.log(err);
      }

      })();
    // });
  }
}

module.exports = { DatabaseBackupCron };
