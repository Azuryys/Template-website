import "./globals.css";

export const metadata = {
  title: "Banner Template Creator",
  description: "Create custom banners with multiple preset sizes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}