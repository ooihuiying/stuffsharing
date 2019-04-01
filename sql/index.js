const sql = {}

sql.query = {
	showuser:  'select* from Users',

	//insert
	add_user: 'INSERT INTO Users (uid, username, password, phone, region, country) VALUES ($1,$2,$3,$4,$5,$6)',

	// Update
	update_info: 'UPDATE Users SET phone=$2, region=$3, country=$4 WHERE username=$1',
	update_pass: 'UPDATE Users SET password=$2 WHERE username=$1',

	//complaints
	write_complaints: 'INSERT INTO writeComplaints (cid, complaint, dateTime, uid) VALUES ($1,$2,$3,$4)',

	// Login
	userpass: 'SELECT * FROM Users WHERE username=$1',

	// Search
	search_user: 'SELECT * FROM Users WHERE lower(username) LIKE $1',
	search_stuff: 'SELECT * FROM Stuffs NATURAL JOIN Descriptions NATURAL JOIN Users WHERE lower(stuffName) LIKE $1',

	// Discover
	discover: 'SELECT * FROM Stuffs NATURAL JOIN Descriptions NATURAL JOIN Users WHERE Descriptions.pickUpLocation = (SELECT region FROM Users WHERE username = $1) OR Descriptions.returnLocation = (SELECT region FROM Users WHERE username = $1)',

	// Information
	page_lims: 'SELECT * FROM Users ORDER BY ranking ASC LIMIT 10 OFFSET $1',
}

module.exports = sql