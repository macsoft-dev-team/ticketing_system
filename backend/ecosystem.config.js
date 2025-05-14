module.exports = {
  apps : [{
    name: 'Macsoft CMS2',
    script: 'index.js', 
    watch: false,
    env: {
    PORT: "4001",
    host:"localhost",
    user:"root",
    password:"Welcome123!",
    db:"ticketsystem2"
    }
  }]
};
