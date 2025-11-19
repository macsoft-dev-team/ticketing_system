 
module.exports = {
  apps : [
    {
    name: 'Macsoft CMS2',
      script: './bin/www',
      watch: '.',
      env: {
        NODE_ENV: 'development',
     	DATABASE_URL: "mysql://root:Welcome123!@localhost:3306/ticketsystem2",
        PORT:4052,
        JWT_SECRET_KEY:"dontshareMeCMS2",
      },
      env_production: {
        NODE_ENV: 'production',
      	DATABASE_URL: "mysql://root:Welcome123!@localhost:3306/ticketsystem2",
        PORT:4052,
        JWT_SECRET_KEY:"dontshareMeCMS2",
       }
    }
  ]
};

