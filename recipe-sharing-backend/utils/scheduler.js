const cron = require('node-cron');
const { syncAllToTypesense } = require('./typesenseSync');

// Hàm để thiết lập cronjob
function setupScheduledJobs() {
  try {
    // Kiểm tra nếu cron-job đã được cài đặt
    if (!cron) {
      console.error('node-cron package not found. Please install it with npm install node-cron');
      return false;
    }
    
    console.log('Setting up scheduled jobs...');
    
    // Đồng bộ dữ liệu vào lúc 3h sáng hàng ngày
    cron.schedule('0 3 * * *', async () => {
      console.log('Running scheduled Typesense sync...');
      try {
        await syncAllToTypesense();
        console.log('Scheduled Typesense sync completed');
      } catch (error) {
        console.error('Scheduled Typesense sync failed:', error);
      }
    });
    
    console.log('Scheduled jobs set up successfully');
    return true;
  } catch (error) {
    console.error('Error setting up scheduled jobs:', error);
    return false;
  }
}

module.exports = { setupScheduledJobs };