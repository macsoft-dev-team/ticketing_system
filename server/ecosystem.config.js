module.exports = {
  apps: [
    {
      name: "TICKETING SYSTEM API",
      script: "bin/www",
      env: {
        NODE_ENV: "development",
        JWT_SECRET: "whatasecretforyou",
        DATABASE_URL: "mysql://root:Welcome123!@localhost:3306/ticketingsystem",
        PORT: 4055,
        FILE_UPLOAD_PATH: "/var/www/ticketsystem2/uploads",
        UPLOAD_DIR: "/var/www/ticketsystem2/uploads",
        PASSWORD_RESET_URL:
          "https://cms.macsoftautomations.in/auth/reset-password",
        ZEPTO_MAIL_URL: "api.zeptomail.in/",
        ZEPTO_MAIL_TEMPLATE_KEY:
          "2518b.66b5be0ceb82ed4c.k1.6966d6f0-f8d3-11ef-91c7-ae9c7e0b6a9f.195604a49df",
        ZEPTO_MAIL_TOKEN:
          "Zoho-enczapikey PHtE6r0ORe7jiTUn+kcJ5/W7FZajPI94q+tgKVROsIcWXqAATU0A/doukT/hqkt7BKITRqLOwIJp57KftOuHIT7rNzlKX2qyqK3sx/VYSPOZsbq6x00UsVkSdkLaXIbqc9do3SzRuNzfNA==",
        BOUNCE_ADDRESS: "bounce@zeptomail.macsoftautomations.in",
        BOUNCE_NOREPLY: "noreply@macsoftautomations.in",
        NOREPLY_NAME: "noreply",
      },
      env_production: {
        NODE_ENV: "production",
        JWT_SECRET: "nevergonnagiveyouup",
        DATABASE_URL: "mysql://root:Welcome123!@localhost:3306/ticketingsystem",
        PORT: 4055,
        FILE_UPLOAD_PATH: "/var/www/ticketsystem2/uploads",
        UPLOAD_DIR: "/var/www/ticketsystem2/uploads",
        PASSWORD_RESET_URL:
          "https://cms.macsoftautomations.in/auth/reset-password",
        ZEPTO_MAIL_URL: "api.zeptomail.in/",
        ZEPTO_MAIL_TEMPLATE_KEY:
          "2518b.66b5be0ceb82ed4c.k1.6966d6f0-f8d3-11ef-91c7-ae9c7e0b6a9f.195604a49df",
        ZEPTO_MAIL_TOKEN:
          "Zoho-enczapikey PHtE6r0ORe7jiTUn+kcJ5/W7FZajPI94q+tgKVROsIcWXqAATU0A/doukT/hqkt7BKITRqLOwIJp57KftOuHIT7rNzlKX2qyqK3sx/VYSPOZsbq6x00UsVkSdkLaXIbqc9do3SzRuNzfNA==",
        BOUNCE_ADDRESS: "bounce@zeptomail.macsoftautomations.in",
        BOUNCE_NOREPLY: "noreply@macsoftautomations.in",
        NOREPLY_NAME: "noreply",
        ENABLE_MEDIA_UPLOAD:false,
MAX_FILE_SIZE_MB:50,
MAX_VIDEO_DURATION_SECONDS:300,
MAX_AUDIO_DURATION_SECONDS:600,
      },
    },
  ],
};
