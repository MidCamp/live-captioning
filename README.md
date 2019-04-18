# Live Captioning

## Getting Started

1. Clone this repo or download as a ZIP to your local computer.
1. Open `index.html` in Chrome desktop (25+).
1. Click the button `Click to Caption` to begin captioning.
1. Allow use of microphone when prompted by the browser.
1. Begin talking. May need to pause occasionaly.
1. Click text on screen to stop captioning.

When using for presenters at events, place an external microphone connected to your laptop near the person speaking for the best results. Make sure your computer is configured to use the external microphone.

Adjust the size of the text and colors via the CSS in `css/live-captioning.css` as needed.

### Requirements
* Chrome desktop (25+).
* Connection to the Internet.
* JavaScript enabled.

### How It Works
It's quite simple! This is a single HTML file that uses CSS styling and JavaScript to convert speech-to-text using the Chrome browser. You can simply open the HTML on your local computer. Or, you can take the files and host them on your own site. To see this in action, go to:
https://lc.midcamp.org/

## Known Issues
The following are known issues:

* **Timeout.** The connection may time out after an extended period of time. In our experience, the captioning stopped somewhere between 5-10 minutes. To fix, you can refresh your browser. When using Live Captioning at Meet Ups or Events, we assigned a person to the computer to monitor activity and refresh as necessary.

* **Text extending off the page.** When a person speaks continuously without breaks, the text will continue to render off the page. This is due to the fixed positioning of the text within the page. To fix, you can either:
  * Refresh your browser.
  * Wait until the speaker has a natural break. Captioning will reset.

* **Text not captured as a transcript or written to a file.** The text is NOT saved after it disappears from the screen.

* **Browser remembering microphone settings.** Chrome has the ability to remember that you allowed access to the microphone. Review this setting here:
  * Open Chrome.
  * Click on the Settings icon, located on the top right of your browser window and is represented by either three dots or three horizontal lines (known as the Hamburger Menu); this will open up a dropdown menu, and Settings will be located to the bottom of the screen.
  * You can also type in chrome://settings/ into the address bar to locate the page
  * Mac OS X users can also open the Settings page by choosing Chrome > Preferences or hit `⌘,` (Command key plus the comma key).
  * Under "Privacy and security," click "Content settings."
  * Click "Microphone."
  * Turn "Ask before accessing (recommended)" on or off.
  * Review the list of sites under "Block" or "Allow" to see if your site is being blocked.

* **Host on site using SSL certificates.** In our experience, hosting the HTML/CSS/JS files on a site at a URL using HTTPS produces the best results to keep the website listed in the "Allow" section of Chrome settings. This stops Chrome from continuously asking for permission to use your microphone.

## Additional Information
Chrome supports the Web Speech API, a mechanism for converting speech to text on a web page. It uses Google's servers to perform the conversion. Using the feature sends an audio recording to Google (audio data is not sent directly to the page itself), along with the domain of the website using the API, your default browser language and the language settings of the website. Cookies are not sent along with these requests. More information can be found here:
* https://developers.google.com/web/updates/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API
* https://w3c.github.io/speech-api/

## Contributing
Pull requests, issues, and good advice are all things that would make a difference to this project. You can contribute by telling us how useful Live Captioning is to you; please let us know on Twitter at [@andrewozone](https://twitter.com/@andrewozone) and [@qymanaonaquest](https://twitter.com/@qymanaonaquest). Any time generously donated to helping make this project better is gratefully accepted.

## About
This was developed to caption the Midwest Drupal Camp ([MidCamp](https://www.midcamp.org/)) in Chicago when a hearing impaired individual asked about accessibility. According to him, this approach worked amazingly well. While it was not perfect, it was a game changer for him. Before, he would never go to camps. Now, he wants to go to all the camps. We are excited to share and continue to refine.

Live Captioning is our first open source project, and your suggestions and feedback are welcome. The project is in a pre-beta phase and is liable to change at any time.

## Credits
This approach is based on the following CodePen created by Dave Rupert [@davatron5000](https://twitter.com/@davatron5000).
https://codepen.io/davatron5000/pen/IKAxb

Thanks to Fatima Sarah Khalid [@sugaroverflow](https://twitter.com/@sugaroverflow) for suggesting this CodePen and inspiring the first version tested at Midwest Drupal Camp (MidCamp) 2019 in Chicago, Illinois.

Thanks to Burton Kent, Nerdery in Chicago, for your feedback and insight.
