const express             = require("express"),
    app                   = express(),
    router                = express.Router(),
    methodOverride        = require("method-override"),
    Event                = require("../models/event"),
    Course                = require("../models/course"),
    Application                = require("../models/application"),
    flash                 = require("connect-flash"),
    xoauth2               = require("xoauth2"),
    nodemailer            = require("nodemailer"),
    dotenv                = require("dotenv");

dotenv.config();

app.use(methodOverride("_method"));
app.use(flash());




router.get("/search", isLoggedIn, (req, res) => {
    const regex = new RegExp(escapeRegex(req.query.name), 'gi');
    Application.find({name: regex}).populate([{ 
                path: 'event',
                populate: {
                  path: 'office',
                  model: 'Office'
                } 
             }, "course"]).exec((err, applications) => {
        if(err){
            console.log(err);
        } else {
           
            res.render("./applications/search", {applications: applications, currentUser: req.user, param: req.query.name, header: `Driver Nauka Jazdy | Motocykle | Zapisy na kursy | Wyszukiwanie po parametrze ${req.query.name}`})
                   
                
            
        }
    })
})

router.get("/category/:category", isLoggedIn, function(req, res){
    Course.findOne({category: req.params.category}, (err, course) => {
        if(err){
            console.log(err);
        } else {
            Application.find({course: course._id}).populate([{ 
                path: 'event',
                populate: {
                  path: 'office',
                  model: 'Office'
                } 
             }, "course"]).exec((err,applications) => {
                if(err){
                    console.log(err);
                } else {
                    
                    res.render("./applications/category", {applications: applications, currentUser: req.user, param: req.params.category, header: `Driver Nauka Jazdy | Motocykle | Zapisy na kursy | Wyszukiwanie po parametrze ${req.params.category}`})
                           
                        
                    
                }
            })
        }
    })
})

router.get("/new", function(req, res){
    Event.findById(req.query.event_id).populate(["course", "office"]).exec(function(err, event){
        if(err){
            console.log(err);
        } else {
            res.render("./applications/new", {currentUser: req.user,header:"Driver Nauka Jazdy | Motocykle | Zapisz si?? na kurs", event:event});
        }
    });
    
});

router.get("/", isLoggedIn, function(req, res){
    Application.find({}).populate(["course", { 
                path: 'event',
                populate: {
                  path: 'office',
                  model: 'Office'
                } 
             }]).exec(function(err, applications){
        if(err){
            console.log(err);
        } else {
            
            res.render("./applications/index", {currentUser: req.user, header:"Driver Nauka Jazdy | Motocykle | Zapisy na kurs",applications:applications});
                
            
        }
    })
});

router.post("/", function(req, res){
    Application.create(
        {
            name: req.body.name, 
            phone: req.body.phone, 
            email:req.body.email,
            isApplicated: false
        }, function(err, createdApplication){
        if(err){
            console.log(err);
        } else {
            Event.findById(req.body.event, function(err, event){
                if(err){
                    console.log(err);
                } else {
                    
                    createdApplication.event = event._id;
                    createdApplication.course = event.course;
                    createdApplication.save();
                    req.flash("success", "Twoja aplikacja na kurs zosta??a wys??ana. Za nied??ugo przyjdzie email z potwierdzeniem i dalszymi instrukcjami");
                    res.redirect("/")
                }
            })
        }
    })
})



router.get("/:id/delete", isLoggedIn, function(req, res){
    Application.findByIdAndRemove(req.params.id, function(err, deletedApplication){
        if(err){
            console.log(err);
        } else {
            res.redirect("/applications")
        }
    })
});

router.post("/:id/accepted", isLoggedIn, function(req, res, next){
    
            Application.findById(req.params.id).populate(["course", { 
                path: 'event',
                populate: {
                  path: 'office',
                  model: 'Office'
                } 
             }]).exec(function(err, application){
                if(!application){
                    req.flash('error', 'Nie znale??li??my takiej aplikacji. Spr??buj ponownie');
                    return res.redirect("/applications");
                }
                async function sendMail(application) {
                    let smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                                type: "OAuth2",
                                user: 'driverjazdapl@gmail.com',
                                clientId: process.env.CLIENT_ID,
                                clientSecret: process.env.CLIENT_SECRET,
                                refreshToken: process.env.REFRESH_TOKEN
                                
                                
                            
                           
                        }
                    });
                    let mailOptions = {
                        to: application.email,
                        from: 'Driver jazda',
                        subject: "Potwierdzenie zapisu na kurs prawa jazdy kategorii " + application.course.category,
                        text: 'Witaj ' + application.name + ', \n\n' + 
                        'W??a??nie zapisali??my Ci?? na kurs prawa jazdy kategorii ' + application.course.category +
                        '. Prosimy przyjd?? ' + application.event.date + ' o ' + application.event.time + 
                        ' do biura w miejscowo??ci ' + application.event.city + ' z numerem PKK, ??eby??my mogli doko??czy?? procedur?? zapisu.' +
                        ' Dostaniesz wtedy r??wnie?? dodatkowe materia??y np. p??yt?? z pytaniami do egzaminu.' + '\n\n' +
                        'Pozdrawiamy,' + '\n' + 'Zesp???? Driver jazda'  
                    };
                    smtpTransport.sendMail(mailOptions, function(err){
                        req.flash("success", "Email zosta?? wys??any na adres " + application.email);
                        done(err, 'done');
                    });
                }
                sendMail(createdApplication);
                application.isApplicated = true;
                application.save();
                res.redirect('/applications');
            });
       
        
   
});

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Nie masz dost??pu do tej strony");
    res.redirect("/subpages/strona-g????wna");
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;