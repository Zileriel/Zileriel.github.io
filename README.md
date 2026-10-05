# Herkus Žilaitis — Portfolio

Personal developer portfolio showcasing selected projects, skills, and experience.

The portfolio automatically loads projects from GitHub, allowing repositories to be managed directly through GitHub without manually updating the website.

## Features

- GitHub-powered project discovery
- Automatically displays repositories tagged with the `portfolio` topic
- Project filtering by programming language
- Automatic README.md rendering
- GitHub-style alerts
- Syntax highlighting for code blocks
- Relative README image resolution
- Automatic project thumbnail extraction
- Project detail dialogs
- Smooth README navigation
- Responsive layout
- Reduced-motion support
- Contact links
- Minimal monochrome design

## Tech Stack

- HTML
- CSS
- JavaScript
- GitHub REST API
- Marked
- DOMPurify
- Highlight.js

## Project Structure

```text
.
├── assets
|   ├── profile.png
├── index.html
├── style.css
├── script.js
└── README.md
```

## Configuration

Portfolio-specific settings are stored in `script.js`:

```js
const CONFIG = {
  githubUser: "Zileriel",
  portfolioTopic: "portfolio",
  contact: {
    email: "herkus.zilaitis@gmail.com",
    phone: "+370 629 77830",
    linkedin: "https://www.linkedin.com/in/herkus-%C5%BEilaitis/",
    github: "https://github.com/Zileriel",
    services: "https://hestiq.com",
  },
};
```

## License

This repository contains the source code for my personal portfolio.
