var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');



var app = express();
var user_list = {};
var recipes_list = [];
var recipes_id = 0;
var valid_cookies = {};

function Recipe(id, name_of_recipe, summery, user_id, access_type, access_list, picture, recipe_instructions)
{
	this.id = id;
	this.name_of_recipe = name_of_recipe;
    this.summery = summery;
    this.user_id = user_id;
    this.name_of_owner = valid_cookies[user_id];
    this.picture = picture;
    this.recipe_instructions = recipe_instructions;
    this.access_type = access_type; // Can be private/public
    this.access_list = access_list; // a list of permited users(uniqe email).
    this.likes = 0;
    this.products = [];

    function addProduct(product)
    {
        this.products.push(product);
    }
}

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));
app.use('/static', express.static('public'))
app.use(express.static(__dirname + '/public'))

app.use(cookieParser());
app.use('/public',express.static(path.join(__dirname, 'public')));
app.use(bodyParser.text({type: '*/*'}));
var jsonParser = bodyParser.json();

app.use(function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next()
});

app.get('/register/:username/:password/', function(req, res) {

	var user = req.params.username;
	var pass = req.params.password;

	if(isUserExist(user))
	{
		// The user allready register to our system
		res.sendStatus(500);
	}
	else
	{
		user_list[user] = pass;
		console.log(user_list);
		res.send("OK");
	}
});



function isUserExist(user)
{
	if(user_list[user])
		return true;
	return false;
}



app.get('/login/:username/:password', function(req, res) {

var user = req.params.username;
var pass = req.params.password;

	if(user_list[user] && user_list[user] == pass)
	{
		var value = uuidv4();
		valid_cookies[value] = user;
		console.log(valid_cookies);
		var cookieTime = 60 * 60 * 1000;
		res.cookie("UID", value, { expires: new Date(Date.now() + cookieTime)});
        res.cookie("UserName", user, { expires: new Date(Date.now() + cookieTime)});
		res.send("OK");
	}
	else
	{
		// Wrong username or password
		res.sendStatus(500);
	}

});

app.post('/recipe', function(req, res) {


    if(!isValidUser(req))
    {
        console.log("NOT A VALID USER");
        return res.sendStatus(301);
    }


    var user_id = req.cookies.UID;
    var nameOfOwner = req.cookies.UserName;
    var recipeObj = JSON.parse(req.body);
	//var recipe = new Recipe(recipes_id, recipeObj.summery, recipeObj.name_of_recipe, user_id, recipeObj.access_type, recipeObj.access_list, recipeObj.picture, recipeObj.recipe_instructions)
    recipeObj.id = recipes_id;
    recipeObj.name_of_owner = nameOfOwner;
    recipeObj.likes = 0;
    recipes_id++;




    recipes_list.push(recipeObj);
    console.log(recipes_list);
    res.send("OK");


});

app.get('/users', function(req, res) {


    if(!isValidUser(req))
    {
        console.log("NOT A VALID USER");
        return res.sendStatus(301);
    }

	var user_id = req.cookies.UID;
    var user_name = valid_cookies[user_id];

    var usersDict = [];
    var users = Object.keys(user_list);

    for (i = 0; i < users.length; i++) {
        user = users[i];

		if(user != user_name)
			usersDict.push({id: i, text: user});
    }

    res.send(usersDict);

});

app.get('/recipe/:recipe_id', function(req, res) {


    if(!isValidUser(req))
    {
        console.log("NOT A VALID USER");
        return res.sendStatus(301);
    }


    var recipe_id = req.params.recipe_id;
    var recipe = isExistID(recipe_id);

    console.log(recipe_id);
    console.log(recipe);

    if(!recipe)
    {
        // Item does not exist
        res.sendStatus(404);
    }
    else
    {
        res.send(recipe);
    }

});

app.get('/recipes/my', function(req, res) {


    if(!isValidUser(req))
    {
        console.log("NOT A VALID USER");
        return res.sendStatus(301);
    }


    var user_id = req.cookies.UID;
    var user_name = valid_cookies[user_id];
    //var recipe = isExistID(id); can check if uid exsit

	var user_recpie_list = [];

    recipes_list.forEach(function(recipe) {
        if(recipe.name_of_owner == user_name)
        {
            user_recpie_list.push(recipe);
        }
    });

    if(user_recpie_list.length == 0)
    {
        // no recpies for this user
        res.sendStatus(404);
    }
    else
    {
        res.send(user_recpie_list);
    }

});

app.get('/recipes/shared', function(req, res) {


    if(!isValidUser(req))
    {
        console.log("NOT A VALID USER");
        return res.sendStatus(301);
    }


    var user_id = req.cookies.UID;
    var user_name = valid_cookies[user_id];
    //var recipe = isExistID(id); can check if uid exsit

    var shared_recpie_list = [];

    recipes_list.forEach(function(recipe) {

        //recipeObj = JSON.parse(recipe);
        // To-do: check if it works and decide our strategy, shister
        if(recipe.access_type == "public" || recipe.access_list.indexOf(user_name) != -1)
        {
            shared_recpie_list.push(recipe);
        }
    });

    if(shared_recpie_list.length == 0)
    {
        // no recpies for this user
        res.sendStatus(404);
    }
    else
    {
        res.send(shared_recpie_list);
    }

});

function isExistID(id)
{

    var found = false;
    var recipe_found = null;
    var index = -1;

    recipes_list.forEach(function(recipe) {
        //recipeObj = JSON.parse(recipe);
        if(recipe.id == id)
        {
            found = true;
            recipe_found = recipe;
        }
    });

    if(found)
        return recipe_found;
    return false;

}

app.get('/like/:id', function(req, res) {


    if(!isValidUser(req))
    {
        console.log("NOT A VALID USER");
        return res.sendStatus(301);
    }


    var found = false;
    var recipe_id = req.params.id;
    var recipe = "";
    var num = 0;

    for (var i = 0; i < recipes_list.length; i++) {
        recipe = recipes_list[i];
        if(recipe.id == recipe_id)
        {
            //recipe.likes = recipe.likes + 1;
            //recipes_list[i] = recipe;
            recipes_list[i].likes = recipe.likes + 1
            found = true;
            num = i;
        }
    }

    if(found)
    {
        console.log(recipes_list[num].likes.toString());
        return res.send(recipes_list[num].likes.toString()); // Item liked
    }

    return res.sendStatus(404); // Item does not exist


});


app.get('/unlike/:id', function(req, res) {


    if(!isValidUser(req))
    {
        console.log("NOT A VALID USER");
        return res.sendStatus(301);
    }


    var found = false;
    var recipe_id = req.params.id;

    for (i = 0; i < recipes_list.length; i++) {
        recipe = recipes_list[i];
        if(recipe.id == recipe_id)
        {
            recipe.likes = recipe.likes - 1;
            recipes_list[i] = recipe;
            found = true;
        }
    }

    console.log(recipes_list);

    if(found)
        return res.send(recipe.likes.toString()); // Item unliked
    return res.sendStatus(404); // Item does not exist


});

app.delete('/recipe/:id', function(req, res) {


    if(!isValidUser(req))
    {
        console.log("NOT A VALID USER");
        return res.sendStatus(301);
    }

    var id = req.params.id;
    var recipe = isExistID(id);

    if(!recipe)
    {
        // Item does not exist
        res.sendStatus(404);
    }
    else
    {
        var index = recipes_list.indexOf(recipe);
        recipes_list.splice(index, 1);
        console.log(recipes_list);
        res.send("Deleted");
    }

});


app.put('/recipe/', function(req, res) {


    if(!isValidUser(req))
    {
        console.log("NOT A VALID USER");
        return res.sendStatus(301);
    }


    var found = false;
    recipeObj = JSON.parse(req.body);

    for (i = 0; i < recipes_list.length; i++) {
        recipe = recipes_list[i];
        if(recipe.id == recipeObj.id)
        {
            //recipe.name_of_recipe = recipeObj.name_of_recipe;
            recipes_list[i] = recipeObj;
            found = true;
        }
    }

    console.log(recipes_list);

    if(found)
        return res.send("Changed"); // Item changed
    return res.sendStatus(404); // Item does not exist

});



function isValidUser(req)
{
	var userCookie = req.cookies.UID;
	var valid = valid_cookies.hasOwnProperty(userCookie);
	return valid;
}


app.get('/logout', function(req, res){

    var userCookie = req.cookies.UID;
    delete valid_cookies[userCookie];
    res.cookie("UID", '', {expires: new Date(0)});
    res.cookie("UserName", '', {expires: new Date(0)});
    res.redirect('/public/login.html');
});


app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
  console.log('Foodies app listening on port 8080!');
});