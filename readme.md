# The Lost Loot

## ⚔️ A Pirate's Treasure Hunt ⚔️

Welcome to "The Lost Loot," a web-based, mobile-first, augmented reality (AR) treasure hunt game. Players embark on a pirate-themed adventure, using their mobile device to navigate to real-world locations, solve challenges, and collect golden keys to find the ultimate treasure.

## ✨ Features

*   **Geolocation-based Gameplay:** Uses the device's GPS to guide players to physical checkpoint locations.
*   **Augmented Reality Mini-Games:** At each checkpoint, players engage with the world through AR challenges using libraries like A-Frame and AR.js.
*   **Dynamic HUD:** A Heads-Up Display shows player progress, a proximity radar for the next checkpoint, collected clues, and inventory.
*   **Persistent State:** Team progress is saved in the browser, allowing players to pick up where they left off.
*   **No Installation Needed:** Fully web-based, runs on any modern mobile browser that supports the required Web APIs.

## 🛠️ Technology Stack

*   **Frontend:** HTML5, CSS3, vanilla JavaScript (ES6 Modules)
*   **AR Library:** [A-Frame](https://aframe.io/) and [AR.js](https://ar-js-org.github.io/AR.js-docs/)
*   **Web APIs:** Geolocation API, Device Orientation Events API

## 🚀 How to Run Locally for Testing

This project is a static web application and does not have a complex build process. However, due to browser security policies regarding local file access (`file:///`) and the use of Web APIs (like Geolocation), you need to serve the files from a local web server.

Here's the simplest way to do it:

### Prerequisites

You need to have [Node.js](https://nodejs.org/) installed on your machine. This will give you access to `npx`, which can run packages without a global installation.

### Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/GaneshHayagrivanM/the-lost-loot.git
    cd the-lost-loot
    ```

2.  **Start a Local Server:**
    The easiest way to start a server is using the `serve` package. Run the following command from the root directory of the project:
    ```bash
    npx serve
    ```

3.  **Access the Game:**
    The command will output a local network address. Open your web browser and navigate to the URL provided (usually `http://localhost:3000`).

    ```
    ┌──────────────────────────────────────────────────┐
    │                                                  │
    │   Serving!                                       │
    │                                                  │
    │   - Local:            http://localhost:3000      │
    │   - On Your Network:  http://192.168.1.100:3000   │
    │                                                  │
    │   Copied local address to clipboard!             │
    │                                                  │
    └──────────────────────────────────────────────────┘
    ```

You can now play and test the game locally in your browser. For the best experience and to test all features, use a mobile device's browser and access the "On Your Network" address.
