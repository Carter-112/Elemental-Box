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

When building an Android app using PWA Builder, please refer to the `PWA-BUILDER-USAGE.md` file for instructions on using the `pwabuilder-config.json` configuration file. This configuration ensures compatibility with the PWA Builder build environment by setting appropriate Android SDK versions.

If you encounter a 500 internal server error during the build process, follow the solutions outlined in that document. 