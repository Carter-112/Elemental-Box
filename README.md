# ElementalBox

A particle sandbox simulation game.

## Contact Form

The contact form uses a simple mailto: approach:

1. When a user fills out the form and clicks "Send Message"
2. The script creates a mailto: link with the form data
3. This opens the user's default email client
4. The user then needs to manually send the email from their client

### Benefits

- No server-side processing required
- Works without any third-party services or APIs
- No need to configure Netlify or other providers

### Limitations

- Requires the user to have an email client configured on their device
- User has to manually send the email after reviewing it
- Limited formatting options for the email content

## Mobile Responsiveness

Both the Privacy Policy and Contact pages are fully responsive and work on all devices:

- Adapts to both portrait and landscape orientations
- Optimized for various screen sizes (phones, tablets, desktops)
- Improved form layout in landscape mode on mobile devices
- Touch-friendly button sizes and spacing
- Properly sized text for readability on small screens

## Deployment

Simply deploy the static files to any web hosting service like Netlify, GitHub Pages, Vercel, etc.

No environment variables or special configuration is needed for the contact form to work.

## Local Development

To test locally, you can use any simple HTTP server. 

## PWA Builder Android Package

We've provided multiple configuration files to ensure compatibility with PWA Builder when building an Android app:

- `pwabuilder.json` - Primary configuration file
- `android-config.json` - Alternative Android-specific configuration
- `pwabuilder-config.json` - Basic configuration file

These configurations fix the "Internal Server Error: Status code 500" by specifying Android SDK 34 instead of 35.

For detailed instructions on using these files with PWA Builder, see `PWA-BUILDER-USAGE.md`. 