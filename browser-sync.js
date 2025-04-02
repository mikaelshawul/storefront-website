const browserSync = require('browser-sync').create();
//This is for auto reload browser while making changes in the frontend files
// Proxy your Express server
browserSync.init({
    proxy: "http://localhost:3000", // Replace with your Express server's URL
    files: ["frontend/**/*.html", "frontend/**/*.css", "frontend/**/*.js"], // Watch these files for changes
    port: 4000, // Browser-Sync will run on this port
    open: true, // Automatically open the browser
    notify: false // Disable Browser-Sync notifications in the browser
});