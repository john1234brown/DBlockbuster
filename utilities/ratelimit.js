/* TODO
 NEED TO INCLUDE ANOTHER CHECK IP RATE LIMIT SEPERATE FOR NODES THAT ARENT HAVING 
 A SUBDOMAIN REGISTERED THROUGH OUR CLOUDFLARE
 
 ALSO GIVE THEM THERE OWN DB AS WELL TO RATE LIMIT THEM IN TO OPTIMIZE THE WAY ITS SETUP

 THE ONES REGISTERING THROUGH OUR CLOUDFLARE WILL BE ON AVERAGE A RATE LIMIT OF 


 INCLUDE A CheckMacAddress system specifically for Video Relays and Video Providers! which only stores no more then 1 minute at the most just like ips unless there flagged
 
 COME UP WITH A BAN SYSTEM! WHERE WE CAN CHOOSE TO BAN FLAGGED MAC ADDRESSES! NOT IPS as anyone can have anyones IP but mac addresses are unique!

  INCLUDE THE MAC ADDRESS AND IP ADDRESS BEING PASSED INSIDE THE HANDSHAKE SYSTEM SO IT WILL BE OBFUSCATED ON THE VIDEO RELAY SERVER
 */
const path = require('path');
const Database = require('better-sqlite3');
const securityClientDB = new Database(path.join(process.cwd(), '/ClientSecurity.db'), { verbose: console.log });
const securityReadOnlyClientDB = new Database(path.join(process.cwd(),'ClientSecurity.db'), { readonly: true });
const securityNodeDB = new Database(path.join(process.cwd(), 'NodeSecurity.db'), { verbose: console.log });
const securityReadOnlyNodeDB = new Database(path.join(process.cwd(),'NodeSecurity.db'), { readonly: true });


function CheckIP(s) {
	const flagcountresult = securityReadOnlyClientDB.prepare('SELECT COUNT() count FROM (SELECT * FROM Flagged WHERE IP = ?)').get(s);
	console.log('flagcountresult count: ', flagcountresult);
	if(flagcountresult.count === 1){
	const flagcheckresult = securityReadOnlyClientDB.prepare('SELECT * FROM Flagged WHERE IP = ?').get(s);
		//Contains flagged check current count if lower then 1500 then update and add 1 increment!
		if (flagcheckresult.Count < 500) {
			var ctime = Math.floor(new Date().getTime() / 1000);
			securityClientDB.prepare('UPDATE Flagged SET Count = ?, LastEpoch = ? WHERE IP = ?').run((flagcheckresult.Count + 50), ctime, s);
			//update variable
		}
		return true;
	}
	//Updated The Flag IP function to cut out 2 if statements which where redundent to increase response time will see with few test if we can achieve 600ms response times!
	if (flagcountresult.count === 0){
			const last1mcountresult = securityReadOnlyClientDB.prepare('SELECT COUNT() count FROM (SELECT * FROM Last1m WHERE IP = ?)').get(s);
			console.log('Last1m Count Result: ', last1mcountresult.count);
			if (last1mcountresult.count === 1){
				const last1mcheckresult = securityReadOnlyClientDB.prepare('SELECT * FROM Last1m WHERE IP = ?').get(s);
				console.log('Last1m Count:', last1mcheckresult.Count);
				//Safety Cap of 31 to stop memory leaks incase of throttled Like rapid dos attacks this basically stops those right in the butt WEBHOOK!
				if (last1mcheckresult.Count<100) {
					var ctime = Math.floor(new Date().getTime() / 1000);
					securityClientDB.prepare('UPDATE Last1m SET Count = ?, LastEpoch = ? WHERE IP = ?').run((last1mcheckresult.Count+1), ctime, s);
					//Update count
					console.log('IP : ', s, ' Past1mCounter : ', (last1mcheckresult.Count+1));
					if ((last1mcheckresult.Count+1) < 100) {
						console.log('Allowed!');
						//returns false perfectly normal connection rate no issues here!
						return false;
					} 
					//Does contain it here we will check the count if count is greater then 
					if ((last1mcheckresult.Count+1) >= 100) {
						console.log('Denied!');
						return true;
					}
				}
				//var Count = last1mcheckresult.Count;
				//IF they connect again after first denial then they get flagged and if they keep hitting then they stay flagged and the forgive wont clear out fast enough!
				if (last1mcheckresult.Count >= 100) {
					var ctime = Math.floor(new Date().getTime() / 1000);
					//Remove and auto add to flagged ips!
					//Delete from past1m and insert into flagged ips with current count from previous
					securityClientDB.prepare('INSERT INTO Flagged (IP, Count, LastEpoch) VALUES (?, ?, ?)').run(s, (last1mcheckresult.Count+1), ctime);
					//addtoflagstmt.run(s, (last1mcheckresult.Count+1), ctime);
					console.log('Flagged IP', s);
					securityClientDB.prepare('DELETE FROM Last1m WHERE IP = ?').run(s);
					//FlaggedIPs[s] = Past1mIPS[s];
					//Past1mIPS = removeItemOnceArray(Past1mIPS, s);
					return true;
				}
				///
			 }
			if (last1mcountresult.count === 0){
				var ctime = Math.floor(new Date().getTime() / 1000);
				securityClientDB.prepare('INSERT INTO Last1m (IP, Count, LastEpoch) VALUES (?, ?, ?)').run(s, 1, ctime);
				//Insert into the database and return false
				return false;
			}
	}
}

function CheckNodeIP(s) {
	const flagcountresult = securityReadOnlyNodeDB.prepare('SELECT COUNT() count FROM (SELECT * FROM Flagged WHERE IP = ?)').get(s);
	console.log('flagcountresult count: ', flagcountresult);
	if(flagcountresult.count === 1){
	const flagcheckresult = securityReadOnlyNodeDB.prepare('SELECT * FROM Flagged WHERE IP = ?').get(s);
		//Contains flagged check current count if lower then 1500 then update and add 1 increment!
		if (flagcheckresult.Count < 500) {
			var ctime = Math.floor(new Date().getTime() / 1000);
			securityNodeDB.prepare('UPDATE Flagged SET Count = ?, LastEpoch = ? WHERE IP = ?').run((flagcheckresult.Count + 50), ctime, s);
			//update variable
		}
		return true;
	}
	//Updated The Flag IP function to cut out 2 if statements which where redundent to increase response time will see with few test if we can achieve 600ms response times!
	if (flagcountresult.count === 0){
			const last1mcountresult = securityReadOnlyNodeDB.prepare('SELECT COUNT() count FROM (SELECT * FROM Last1m WHERE IP = ?)').get(s);
			console.log('Last1m Count Result: ', last1mcountresult.count);
			if (last1mcountresult.count === 1){
				const last1mcheckresult = securityReadOnlyNodeDB.prepare('SELECT * FROM Last1m WHERE IP = ?').get(s);
				console.log('Last1m Count:', last1mcheckresult.Count);
				//Safety Cap of 31 to stop memory leaks incase of throttled Like rapid dos attacks this basically stops those right in the butt WEBHOOK!
				if (last1mcheckresult.Count<15) {
					var ctime = Math.floor(new Date().getTime() / 1000);
					securityNodeDB.prepare('UPDATE Last1m SET Count = ?, LastEpoch = ? WHERE IP = ?').run((last1mcheckresult.Count+1), ctime, s);
					//Update count
					console.log('IP : ', s, ' Past1mCounter : ', (last1mcheckresult.Count+1));
					if ((last1mcheckresult.Count+1) < 15) {
						console.log('Allowed!');
						//returns false perfectly normal connection rate no issues here!
						return false;
					} 
					//Does contain it here we will check the count if count is greater then 
					if ((last1mcheckresult.Count+1) >= 15) {
						console.log('Denied!');
						return true;
					}
				}
				//var Count = last1mcheckresult.Count;
				//IF they connect again after first denial then they get flagged and if they keep hitting then they stay flagged and the forgive wont clear out fast enough!
				if (last1mcheckresult.Count >= 15) {
					var ctime = Math.floor(new Date().getTime() / 1000);
					//Remove and auto add to flagged ips!
					//Delete from past1m and insert into flagged ips with current count from previous
					securityNodeDB.prepare('INSERT INTO Flagged (IP, Count, LastEpoch) VALUES (?, ?, ?)').run(s, (last1mcheckresult.Count+1), ctime);
					//addtoflagstmt.run(s, (last1mcheckresult.Count+1), ctime);
					console.log('Flagged IP', s);
					securityNodeDB.prepare('DELETE FROM Last1m WHERE IP = ?').run(s);
					//FlaggedIPs[s] = Past1mIPS[s];
					//Past1mIPS = removeItemOnceArray(Past1mIPS, s);
					return true;
				}
				///
			 }
			if (last1mcountresult.count === 0){
				var ctime = Math.floor(new Date().getTime() / 1000);
				securityNodeDB.prepare('INSERT INTO Last1m (IP, Count, LastEpoch) VALUES (?, ?, ?)').run(s, 1, ctime);
				//Insert into the database and return false
				return false;
			}
	}
}

//Converted to Better Sqlite3
function FlagIPForgiveness() {
  FlagIPForgiveness2();
	var rows = securityReadOnlyClientDB.prepare('SELECT * FROM Flagged').all();
	//var rows = stmt.all();
	//var iplist = [];
	console.log(rows);
	if (rows !== (null || undefined)){
	for (i in rows) {
		console.log(rows[i]);
		if (rows[i].Count <= 550) {
			var newcount = rows[i].Count - 50;
			var stmt3 = securityClientDB.prepare('UPDATE Flagged SET Count = ? WHERE IP = ?');
			stmt3.run(newcount, rows[i].IP);
		}
		if (rows[i].Count <= 50) {
			//iplist.push(ips.IP);
		  	console.log('found IT!');
			console.log(rows[i].IP);
			console.log(rows[i].Count);
			console.log(rows[i].LastEpoch);
			var ip = rows[i].IP.toString();
			//console.log(iplist);
			//console.log(`DELETE FROM Flagged WHERE IP = '${ip}'`);
			//securityClientDB.run(`DELETE FROM Flagged WHERE IP = '${ip}'`);
			var stmt2 = securityClientDB.prepare('DELETE FROM Flagged WHERE IP = ?');
			stmt2.run(ip);
		  //break;
		}
		}
	}
}

function FlagIPForgiveness2() {
	var rows = securityReadOnlyNodeDB.prepare('SELECT * FROM Flagged').all();
	//var rows = stmt.all();
	//var iplist = [];
	console.log(rows);
	if (rows !== (null || undefined)){
	for (i in rows) {
		console.log(rows[i]);
		if (rows[i].Count <= 550) {
			var newcount = rows[i].Count - 50;
			var stmt3 = securityNodeDB.prepare('UPDATE Flagged SET Count = ? WHERE IP = ?');
			stmt3.run(newcount, rows[i].IP);
		}
		if (rows[i].Count <= 50) {
			//iplist.push(ips.IP);
		  	console.log('found IT!');
			console.log(rows[i].IP);
			console.log(rows[i].Count);
			console.log(rows[i].LastEpoch);
			var ip = rows[i].IP.toString();
			//console.log(iplist);
			//console.log(`DELETE FROM Flagged WHERE IP = '${ip}'`);
			//securityClientDB.run(`DELETE FROM Flagged WHERE IP = '${ip}'`);
			var stmt2 = securityNodeDB.prepare('DELETE FROM Flagged WHERE IP = ?');
			stmt2.run(ip);
		  //break;
		}
		}
	}
}
							//Dont Forget To Change back to 15*60*1000
setInterval(FlagIPForgiveness, (1 * 60 * 1000)); //Every 15 minutes ip forgiveness happens!
//FlagIPForgiveness();
//IP Logging For Flagging To many requests from the same IP address!

function Past1mIPSClear() {
	securityClientDB.prepare('DELETE FROM Last1m').run();
  securityNodeDB.prepare('DELETE FROM Last1m').run();
}
setInterval(Past1mIPSClear, (60 * 1000));


module.exports = { CheckIP, CheckNodeIP }