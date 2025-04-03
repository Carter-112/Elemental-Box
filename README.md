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

## Deployment

Simply deploy the static files to any web hosting service like Netlify, GitHub Pages, Vercel, etc.

No environment variables or special configuration is needed for the contact form to work.

## Local Development

To test locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Install Netlify CLI globally:
   ```
   npm install netlify-cli -g
   ```

3. Create a `.env` file with your SendGrid API key:
   ```
   SENDGRID_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```
   netlify dev
   ```

5. Open http://localhost:8888 in your browser 