const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');


const app = express();

require('./config/passport')(passport);

//DB url
const db = 'mongodb://localhost:27017/newlogindb';

mongoose.connect(db, {useNewUrlParser: true})
    .then(() => console.log('Mongoose Connect'))
    .catch(err => console.error(err));

//ejs
app.use(expressLayouts);
app.set('view engine', 'ejs');

//Bodyparser
app.use(express.urlencoded({ express: false }));

//express Session


app.use(
    session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
    })
);

app.use(passport.initialize());
app.use(passport.session());


//connect flash massaging
app.use(flash());
app.use((req, res, next) =>{
     res.locals.success_msg = req.flash('success_msg');
     res.locals.error_msg = req.flash('error_msg');
     next();
})

function setUserInResponseLocals(req, res, next) {
  res.locals.user = req.user || null;
  next();
}

app.use(setUserInResponseLocals);
//Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));


const PORT = process.env.PORT || 5000; 

app.listen(PORT, console.log(`Server listening on port ${PORT}`));
