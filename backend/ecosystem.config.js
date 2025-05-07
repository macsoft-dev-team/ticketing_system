module.exports = {
  apps : [{
    name: 'Macsoft CMS2',
    script: 'index.js', 
    watch: false,
    env: {
	PORT: "8081",
	host:"localhost",
	user:"root",
	password:"Welcome123!",
	db:"ticketsystem2"
    }
  }]
};
