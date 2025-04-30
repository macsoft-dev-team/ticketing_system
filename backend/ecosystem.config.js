module.exports = {
  apps : [{
    name: 'Macsoft CMS',
    script: 'index.js', 
    watch: false,
    env: {
	PORT: "8080",
	host:"localhost",
	user:"root",
	password:"Welcome123!",
	db:"ticketsystem"
    }
  }]
};
