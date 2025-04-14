# 📦 Storefront Website Setup and Usage Guide

A simple guide to setup the storefront locally.

## 🔸 Prerequisites

Make sure the following are installed on your system:

* [Node.js](https://nodejs.org/) (version 16 or higher)
* [MongoDB](https://www.mongodb.com/try/download/community) (version 4.4 or higher)
* [npm](https://www.npmjs.com/) (usually comes with Node.js)
* [Git](https://git-scm.com/)

## ⚙️ Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/mikaelshawul/storefront-website.git
cd storefront-website
npm install
```

## 🗄️ Database Setup

1. Create the data directory for MongoDB:

```bash
mkdir -p data/db
```

2. Start the MongoDB server:

```bash
npm run db
```

This will start MongoDB on the default port 27017.

## 🚀 Running the Application

1. Start the Express server:

```bash
npm start
```

The server will start on port 3000. You can access the application at http://localhost:3000

2. (Optional) Start Browser-Sync for development with live reload:

```bash
npm run live
```

Browser-Sync will start on port 4000 and proxy requests to the Express server.
You can access the live view at http://localhost:4000

## 🔧 Troubleshooting

- If MongoDB fails to start, ensure the data/db directory has proper permissions
- If ports 3000 or 4000 are already in use, you can modify them in the configuration files
