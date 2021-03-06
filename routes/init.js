const sql_query = require('../sql');
const passport = require('passport');
const bcrypt = require('bcrypt')

// PostgreSQL Connection
const {Pool} = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    //ssl: true
});

const round = 10;
const salt = bcrypt.genSaltSync(round);
const uuidv1 = require('uuid/v1'); // npm install uuid

function initRouter(app) {
    /* GET */
    app.get('/', index);
    app.get('/search', search);
    app.get('/stuff', stuff);
    app.get('/categorySearch', categorySearch);
    app.get('/leaderboard', leaderboard);

    /* PROTECTED GET */
    app.get('/dashboard', passport.authMiddleware(), dashboard);
    app.get('/update', passport.authMiddleware(), update);
    app.get('/discover', passport.authMiddleware(), discover);
    app.get('/myStuff', passport.authMiddleware(), myStuff);
    app.get('/categories', passport.authMiddleware(), categories);
    app.get('/feedback', passport.authMiddleware(), feedback);
    app.get('/register', passport.antiMiddleware(), register);
    app.get('/password', passport.antiMiddleware(), retrieve);
    app.get('/manageStuff', passport.authMiddleware(), manageStuff);
    app.get('/comment', passport.authMiddleware(), comment);
    app.get('/profile', passport.authMiddleware(), profile);

    /* PROTECTED POST */
    app.post('/update_info', passport.authMiddleware(), update_info);
    app.post('/update_pass', passport.authMiddleware(), update_pass);
    app.post('/submit_feedback', passport.authMiddleware(), submit_feedback);
    app.post('/lendNewStuff', passport.authMiddleware(), lend);
    app.post('/deleteStuff', passport.authMiddleware(), deleteStuff);
    app.post('/accept', passport.authMiddleware(), accept);
    app.post('/updateStuff', passport.authMiddleware(), updateStuff);
    app.post('/submitComment', passport.authMiddleware(), submitComment);
    app.post('/reg_user', passport.antiMiddleware(), reg_user);
    app.post('/bids', passport.authMiddleware(), bids);
    app.post('/cancelBid', passport.authMiddleware(), cancelBid);

    /* LOGIN */
    app.post('/login', passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/'
    }));

    /* LOGOUT */
    app.get('/logout', passport.authMiddleware(), logout);
}


// Render Function
function basic(req, res, page, other) {
    var info = {
        page: page,
        username: req.user.username,
        phone: req.user.phone,
        region: req.user.region,
        country: req.user.country
    };
    if (other) {
        for (var fld in other) {
            info[fld] = other[fld];
        }
    }
    res.render(page, info);
}

function query(req, fld) {
    return req.query[fld] ? req.query[fld] : '';
}

function msg(req, fld, pass, fail) {
    var info = query(req, fld);
    return info ? (info == 'pass' ? pass : fail) : '';
}

// GET
function index(req, res, next) {
    if (!req.isAuthenticated()) {
        res.render('index', {page: '', auth: false});
    } else {
        basic(req, res, 'index', {page: '', auth: true});
    }
}

function search(req, res, next) {
    var ctx = 0, tbl;
    pool.query(sql_query.query.search_stuff, [req.query.query], (err, data) => {
        if (err || !data.rows || data.rows.length == 0) {
            ctx = 0;
            tbl = [];
        } else {
            ctx = data.rows.length;
            tbl = data.rows;
        }
        if (req.isAuthenticated()) {
            basic(req, res, 'search', {page: 'search', auth: true, tbl: tbl, ctx: ctx, user: req.user.username});
        }
    });
}

function dashboard(req, res, next) {
    var ctx1 = 0, ctx2 = 0, ctx3 = 0, ctx4 = 0, tbl1, tbl2, tbl3, tbl4;
    pool.query(sql_query.query.findUid, [req.user.username], (err, data) => {
        var uid = data.rows[0].uid;
        pool.query(sql_query.query.borrowed, [uid], (err, data) => {
            if (err) {
                console.error(err);
            } else if (!data.rows || data.rows.length == 0) {
                ctx1 = 0;
                tbl1 = [];
            } else {
                ctx1 = data.rows.length;
                tbl1 = data.rows;
            }
            pool.query(sql_query.query.badges, [uid], (err, data) => {
                if (err) {
                    console.error("Error in loading badges");
                    res.redirect('/dashboard?badges=fail');
                } else if (!data.rows || data.rows.length == 0) {
                    ctx2 = 0;
                    tbl2 = [];
                } else {
                    ctx2 = data.rows.length;
                    tbl2 = data.rows;
                }
                pool.query(sql_query.query.lent, [uid], (err, data) => {
                    if (err) {
                        console.error("Error in update info");
                    } else if (!data.rows || data.rows.length == 0) {
                        ctx3 = 0;
                        tbl3 = [];
                    } else {
                        ctx3 = data.rows.length;
                        tbl3 = data.rows;
                    }
                    pool.query(sql_query.query.pending_bids, [uid], (err, data) => {
                        if (err) {
                            console.error("Error in update info");
                        } else if (!data.rows || data.rows.length == 0) {
                            ctx4 = 0;
                            tbl4 = [];
                        } else {
                            ctx4 = data.rows.length;
                            tbl4 = data.rows;
                        }
                        if (req.isAuthenticated()) {
                            basic(req, res, 'dashboard', {
                                page: 'dashboard',
                                auth: true,
                                user: req.user.username,
                                tbl1: tbl1,
                                ctx1: ctx1,
                                tbl2: tbl2,
                                ctx2: ctx2,
                                tbl3: tbl3,
                                ctx3: ctx3,
                                tbl4: tbl4,
                                ctx4: ctx4
                            });
                        }
                    });
                });
            });
        });
    });
}

function profile(req, res, next) {
    var ctx1 = 0, ctx2 = 0, ctx3 = 0, tbl1, tbl2, tbl3;
    pool.query(sql_query.query.findUid, [req.query.user], (err, data) => {
        var uid = data.rows[0].uid;
        pool.query(sql_query.query.borrowed, [uid], (err, data) => {
            if (err) {
                console.error(err);
            } else if (!data.rows || data.rows.length == 0) {
                ctx1 = 0;
                tbl1 = [];
            } else {
                ctx1 = data.rows.length;
                tbl1 = data.rows;
            }
            pool.query(sql_query.query.badges, [uid], (err, data) => {
                if (err) {
                    console.error("Error in loading badges");
                    res.redirect('/profile?badges=fail');
                } else if (!data.rows || data.rows.length == 0) {
                    ctx2 = 0;
                    tbl2 = [];
                } else {
                    ctx2 = data.rows.length;
                    tbl2 = data.rows;
                }
                pool.query(sql_query.query.lent, [uid], (err, data) => {
                    if (err) {
                        console.error("Error in update info");
                    } else if (!data.rows || data.rows.length == 0) {
                        ctx3 = 0;
                        tbl3 = [];
                    } else {
                        ctx3 = data.rows.length;
                        tbl3 = data.rows;
                    }
                    if (req.isAuthenticated()) {
                        basic(req, res, 'profile', {
                            page: 'profile',
                            auth: true,
                            tbl1: tbl1,
                            ctx1: ctx1,
                            tbl2: tbl2,
                            ctx2: ctx2,
                            tbl3: tbl3,
                            ctx3: ctx3,
                            user: req.query.user
                        });
                    }
                });
            });
        });
    });
}

function update(req, res, next) {
    basic(req, res, 'update', {
        info_msg: msg(req, 'info', 'Information updated successfully', 'Error in updating information'),
        pass_msg: msg(req, 'pass', 'Password updated successfully', 'Error in updating password'),
        auth: true
    });
}

function discover(req, res, next) {
    var ctx = 0, ctx2 = 0, tbl, tbl2;
    pool.query(sql_query.query.discover, [req.user.username], (err, data) => {
        if (err || !data.rows || data.rows.length == 0) {
            ctx = 0;
            tbl = [];
        } else {
            ctx = data.rows.length;
            tbl = data.rows;
        }
        pool.query(sql_query.query.discover_all, (err, data) => {
            if (err || !data.rows || data.rows.length == 0) {
                ctx2 = 0;
                tbl2 = [];
            } else {
                ctx2 = data.rows.length;
                tbl2 = data.rows;
            }
            if (req.isAuthenticated()) {
                basic(req, res, 'discover', {
                    page: 'discover',
                    auth: true,
                    tbl: tbl,
                    tbl2: tbl2,
                    ctx: ctx,
                    ctx2: ctx2,
                    user: req.user.username
                });
            }
        });
    });
}

function myStuff(req, res, next) {
    var ctx = 0, tbl;
    var uid;
    pool.query(sql_query.query.findUid, [req.user.username], (err, data) => {
        uid = data.rows[0].uid;
        pool.query(sql_query.query.lending, [uid], (err, data) => {
            if (err) {
                console.error("Error in update info");
                res.redirect('/myStuff?update=fail');
            } else if (!data.rows || data.rows.length == 0) {
                ctx = 0;
                tbl = [];
            } else {
                ctx = data.rows.length;
                tbl = data.rows;
            }
            if (req.isAuthenticated()) {
                basic(req, res, 'myStuff', {
                    page: 'myStuff',
                    auth: true,
                    tbl: tbl,
                    ctx: ctx,
                    lend_msg: msg(req, 'lend', 'Lend stuff successfully', 'Error in stuff information')
                });
            }
        });
    });
}

function categories(req, res, next) {
    basic(req, res, 'categories', {auth: true});
}

function categorySearch(req, res, next) {
    var ctx, tbl;
    pool.query(sql_query.query.categorySearch, [req.query.category], (err, data) => {
        if (err || !data.rows || data.rows.length == 0) {
            ctx = 0;
            tbl = [];
        } else {
            ctx = data.rows.length;
            tbl = data.rows;
        }
        if (req.isAuthenticated()) {
            basic(req, res, 'categorySearch', {
                page: 'categorySearch',
                auth: true,
                tbl: tbl,
                ctx: ctx,
                user: req.user.username,
                category: req.query.category
            });
        }
    });
}

function stuff(req, res, next) {
    var ctx = 0, ctx2 = 0, ctx3 = 0, ctx4 = 0, tbl, tbl2, tbl3, tbl4;
    var uid;
    var sid;
    pool.query(sql_query.query.match_stuff, [req.user.username, req.query.sid], (err, data) => {
        if (data.rows.length > 0) {
            res.redirect('/manageStuff?sid=' + req.query.sid);
        }
        pool.query(sql_query.query.check_borrowed, [req.query.sid], (err, data) => {
            if (err || !data.rows || data.rows.length == 0) {
                ctx4 = 0;
                tbl4 = [];
            } else {
                ctx4 = data.rows.length;
                tbl4 = data.rows;
            }
            pool.query(sql_query.query.findUid, [req.user.username], (err, data) => {
                uid = data.rows[0].uid;
                pool.query(sql_query.query.locate_stuff, [req.query.sid], (err, data) => {
                    if (err || !data.rows || data.rows.length == 0) {
                        ctx = 0;
                        tbl = [];
                        sid = 0;
                    } else {
                        ctx = data.rows.length;
                        tbl = data.rows;
                        sid = data.rows[0].sid;
                    }
                    pool.query(sql_query.query.user_bid, [uid, sid], (err, data) => {
                        if (err) {
                            console.error("Error in bidding");
                            res.redirect('/stuff?bidding=fail');
                        } else if (!data.rows || data.rows.length == 0) {
                            ctx2 = 0;
                            tbl2 = [];
                        } else {
                            ctx2 = data.rows.length;
                            tbl2 = data.rows;
                        }
                        pool.query(sql_query.query.commentList, [sid], (err, data) => {
                            if (err || !data.rows || data.rows.length == 0) {
                                ctx3 = 0;
                                tbl3 = [];
                            } else {
                                ctx3 = data.rows.length;
                                tbl3 = data.rows;
                            }
                            if (req.isAuthenticated()) {
                                basic(req, res, 'stuff', {
                                    page: 'stuff',
                                    auth: true,
                                    tbl: tbl,
                                    tbl2: tbl2,
                                    tbl3: tbl3,
                                    tbl4: tbl4,
                                    ctx: ctx,
                                    ctx2: ctx2,
                                    ctx3: ctx3,
                                    ctx4: ctx4,
                                    sid: sid,
                                    user: req.user.username,
                                    lend_msg: msg(req, 'bid', 'Bid stuff successfully', 'Error in stuff information')
                                });
                            }
                        });
                    });
                });
            });
        });
    });
}

function manageStuff(req, res, next) {
    var ctx = 0, ctx2 = 0, tbl, tbl2, bid, user, uid, userid;
    var sid = req.query.sid;
    pool.query(sql_query.query.findUid, [req.user.username], (err, data) => {
        userid = data.rows[0].uid;
        pool.query(sql_query.query.check_borrowed, [sid], (err, data) => {
            if (!data.rows || data.rows.length == 0) {
                ctx2 = 0;
                tbl2 = [];
            } else {
                ctx2 = data.rows.length;
                tbl2 = data.rows;
            }
            pool.query(sql_query.query.details, [sid], (err, data) => {
                if (err) {
                    console.error(err);
                    res.redirect('/manageStuff?detail=fail');
                } else if (!data.rows || data.rows.length == 0) {
                    ctx = 0;
                    tbl = [];
                } else {
                    ctx = data.rows.length;
                    tbl = data.rows;
                }
                pool.query(sql_query.query.find_max_bid, [sid], (err, data) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/manageStuff?detail=fail');
                    } else if (!data.rows || data.rows.length == 0) {
                        bid = 'No Bid';
                        user = 'None';
                        uid = 'None';
                    } else {
                        bid = data.rows[0].bid;
                        user = data.rows[0].username;
                        uid = data.rows[0].uid;
                    }
                    if (req.isAuthenticated()) {
                        basic(req, res, 'manageStuff', {
                            page: 'manageStuff',
                            auth: true,
                            tbl: tbl,
                            tbl2: tbl2,
                            bid: bid,
                            uid: uid,
                            user: user,
                            userid: userid,
                            ctx: ctx,
                            ctx2: ctx2,
                            delete_msg: msg(req, 'delete', 'Delete successfully', 'Error in deleting stuff'),
                            accept_msg: msg(req, 'accept', 'Accept successfully', 'Error in accepting'),
                            update_msg: msg(req, 'update', 'Update successfully', 'Error in updating')
                        });
                    }
                });
            });
        });
    });
}

function leaderboard(req, res, next) {
    var ctx = 0, tbl;
    var uidInfo;
    pool.query(sql_query.query.findUid, [req.user.username], (err, data) => {
        uidInfo = data.rows[0].uid;
        pool.query(sql_query.query.leaderboard, (err, data) => {
            if (err || !data.rows || data.rows.length == 0) {
                ctx = 0;
                tbl = [];
            } else {
                ctx = data.rows.length;
                tbl = data.rows;
            }
            if (req.isAuthenticated()) {
                basic(req, res, 'leaderboard', {page: 'leaderboard', auth: true, uidInfo: uidInfo, tbl: tbl, ctx: ctx});
            }
        });
    });
}

function comment(req, res, next) {
    var ctx = 0, tbl, uid, stuffname;
    var sid = req.query.sid, username = req.user.username;
    pool.query(sql_query.query.search, [sid], (err, data) => {
        stuffname = data.rows[0].stuffname;
        pool.query(sql_query.query.findUid, [username], (err, data) => {
            uid = data.rows[0].uid;
            pool.query(sql_query.query.commentList, [sid], (err, data) => {
                if (err || !data.rows || data.rows.length == 0) {
                    ctx = 0;
                    tbl = [];
                } else {
                    ctx = data.rows.length;
                    tbl = data.rows;
                }
                if (req.isAuthenticated()) {
                    basic(req, res, 'comment', {
                        page: 'comment',
                        auth: true,
                        sid: sid,
                        uid: uid,
                        tbl: tbl,
                        ctx: ctx,
                        stuffname: stuffname,
                        comment_msg: msg(req, 'comment', 'Comment successfully', 'Error in comment')
                    });
                }
            });
        });
    });
}

function submitComment(req, res, next) {
    var comment = req.body.comment;
    var rating = req.body.rating;
    var updateTime = new Date();
    var sid = req.body.sid;
    var uid = req.body.uid;
    pool.query(sql_query.query.submit_comment, [comment, updateTime, uid, sid, rating], (err, data) => {
        if (err) {
            console.error(err);
            res.redirect('back');
        } else {
            res.redirect('back');
        }
    });
}

function feedback(req, res, next) {
    basic(req, res, 'feedback', {
        info_msg: msg(req, 'info', 'Feedback successfully submitted', 'Error in submitting feedback'),
        pass_msg: msg(req, 'pass', 'Feedback has been received.', 'Error in uploading feedback'),
        auth: true
    });
}

function register(req, res, next) {
    res.render('register', {page: 'register', auth: false});
}

function retrieve(req, res, next) {
    res.render('retrieve', {page: 'retrieve', auth: false});
}

// POST
function update_info(req, res, next) {
    var username = req.body.username;
    var phone = req.body.phone;
    var region = req.body.region;
    var country = req.body.country;
    console.log(username);
    pool.query(sql_query.query.update_info, [username, phone, region, country], (err, data) => {
        if (err) {
            console.error("Error in update info");
            res.redirect('/update?info=fail');
        } else {
            console.log(region);
            res.redirect('/update?info=pass');
        }
    });
}

function update_pass(req, res, next) {
    var username = req.user.username;
    var password = bcrypt.hashSync(req.body.password, salt);
    pool.query(sql_query.query.update_pass, [username, password], (err, data) => {
        if (err) {
            console.error("Error in update pass");
            res.redirect('/update?pass=fail');
        } else {
            res.redirect('/update?pass=pass');
        }
    });
}

function submit_feedback(req, res, next) {
    var fid = uuidv1();
    var username = req.user.username;
    var feedback = req.body.feedback;
    var dateTime = new Date();
    pool.query(sql_query.query.findUid, [username], (err, data) => {
        pool.query(sql_query.query.submit_feedback, [fid, feedback, dateTime, data.rows[0].uid], (err, data) => {
            if (err) {
                console.error("Error in submitting feedback");
                res.redirect('/feedback?pass=fail');
            } else {
                res.redirect('/feedback?pass=pass');
            }
        });
    });
}

function lend(req, res, next) {
    var sid = uuidv1();
    var name = req.body.stuffname;
    var username = req.user.username;
    var price = req.body.nextMinimumBid;
    var pickUpTime = req.body.pickUpTime;
    var returnTime = req.body.returnTime;
    var pickUpLocation = req.body.pickUpLocation;
    var returnLocation = req.body.returnLocation;
    var description = req.body.description;
    var category = req.body.category;
    pool.query(sql_query.query.findUid, [username], (err, data) => {
        var uid = data.rows[0].uid;
        pool.query(sql_query.query.insertToStuff, [sid, name, price], (err, data) => {
            if (err) {
                console.error(err);
                res.redirect('/myStuff?pass=fail');
            } else {
                pool.query(sql_query.query.findUid, [username], (err, data) => {
                    pool.query(sql_query.query.insertToLends, [sid, data.rows[0].uid], (err, data) => {
                        if (err) {
                            console.error(err);
                            res.redirect('/myStuff?pass=fail');
                        } else {
                            pool.query(sql_query.query.findUid, [username], (err, data) => {
                                pool.query(sql_query.query.insertToDescription, [pickUpTime, returnTime, pickUpLocation, returnLocation, description, data.rows[0].uid, sid], (err, data) => {
                                    pool.query(sql_query.query.insertToBelongs, [sid, category], (err, data) => {
                                        if (err) {
                                            console.error(err);
                                            res.redirect('/myStuff?pass=fail');
                                        } else {
                                            res.redirect('/myStuff?pass=pass');
                                        }
                                    });
                                });
                            });
                        }
                    });
                });
            }
        });
    });
}

function deleteStuff(req, res, next) {
    var sid = req.body.sid;
    pool.query(sql_query.query.delete_stuff, [sid], (err, data) => {
        if (err) {
            console.error(err);
            res.redirect('back');
        } else {
            res.redirect('/myStuff');
        }
    });
}

function updateStuff(req, res, next) {
    var sid = req.body.sid;
    var pickUpTime = req.body.pickUpTime;
    var returnTime = req.body.returnTime;
    var pickUpLocation = req.body.pickUpLocation;
    var returnLocation = req.body.returnLocation;
    var description = req.body.description;
    pool.query(sql_query.query.update_stuff, [sid, pickUpTime, returnTime, pickUpLocation, returnLocation, description], (err, data) => {
        if (err) {
            console.error(err);
            res.redirect('back');
        } else {
            res.redirect('back');
        }
    });
}

function accept(req, res, next) {
    var sid = req.body.sid;
    var uid = req.body.uid;
    if (uid === 'None') {
        res.redirect('back');
    } else {
        pool.query(sql_query.query.accept, [uid, sid], (err, data) => {
            if (err) {
                console.error(err);
                res.redirect('back');
            } else {
                res.redirect('/dashboard');
            }
        });
    }
}

function bids(req, res, next) {
    var bid = req.body.bidValue;
    var username = req.user.username;
    var sid = req.body.sid;
    pool.query(sql_query.query.findUid, [username], (err, data) => {
        console.log("Bid Amount: " + bid + " SID: " + sid + " UID: " + data.rows[0].uid);
        pool.query(sql_query.query.bids, [data.rows[0].uid, sid, bid], (err, data) => {
            if (err) {
                console.error(err);
                res.redirect('back');
            } else {
                res.redirect('back');
            }
        });

    });

}

function cancelBid(req, res, next) {
    var username = req.user.username;
    var sid = req.body.sid;
    var uid;
    var highest_bid;
    pool.query(sql_query.query.findUid, [username], (err, data) => {
        uid = data.rows[0].uid;
        pool.query(sql_query.query.cancelBid, [uid, sid], (err, data) => {
            pool.query(sql_query.query.find_max_bid, [sid], (err, data) => {
                if (data.rows.length == 0) {
                    pool.query(sql_query.query.search, [sid], (err, data) => {
                        highest_bid = data.rows[0].originalprice;
                        console.log(data.rows[0]);
                        console.log(highest_bid);
                        pool.query(sql_query.query.replace_bid, [sid, highest_bid], (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('back');
                            } else {
                                res.redirect('back');
                            }
                        });
                    });
                } else {
                    highest_bid = data.rows[0].bid;
                    console.log(highest_bid);
                    pool.query(sql_query.query.replace_bid, [sid, highest_bid], (err, data) => {
                        if (err) {
                            console.error(err);
                            res.redirect('back');
                        } else {
                            res.redirect('back');
                        }
                    });
                }
            });
        });
    });
}

function reg_user(req, res, next) {
    var uid = uuidv1();
    var username = req.body.username;
    var password = bcrypt.hashSync(req.body.password, salt);
    var phone = req.body.phone;
    var region = req.body.region;
    var country = req.body.country;
    pool.query(sql_query.query.add_user, [uid, username, password, phone, region, country], (err, data) => {
        if (err) {
            console.error("Error in adding user", err);
            res.redirect('/register?reg=fail');
        } else {
            console.log('added user ', username, uid);
            req.login({
                username: username,
                passwordHash: password,
                phone: phone,
                region: region,
                country: country
            }, function (err) {
                if (err) {
                    return res.redirect('/register?reg=fail');
                } else {
                    return res.redirect('/dashboard');
                }
            });
        }
    });
}

// LOGOUT
function logout(req, res, next) {
    req.session.destroy()
    req.logout()
    res.redirect('/')
}

module.exports = initRouter;
