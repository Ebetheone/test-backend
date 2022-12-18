var mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

var async = require("async");

var express = require("express");
var app = express();

// Load the Mongoose schema for User, Photo, and SchemaInfo
var bodyParser = require("body-parser");
var cors = require("cors");
var User = require("./schema/user.js");
var { Photo } = require("./schema/photo.js");
var SchemaInfo = require("./schema/schemaInfo.js");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// var { cs142models } = require("./modelData/photoApp.js");
app.use(cors());
mongoose
  .connect(
    "mongodb+srv://Amazon123:Amazon123@cluster0.xqpzaoo.mongodb.net/lab7?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("mongoose connected");
  })
  .catch(() => {
    console.log("mongoose not connected");
  });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

app.get("/test/:p1", function (request, response) {
  console.log("/test called with param1 = ", request.params.p1);

  var param = request.params.p1 || "info";

  if (param === "info") {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
    SchemaInfo.find({}, function (err, info) {
      if (err) {
        // Query returned an error.  We pass it back to the browser with an Internal Service
        // Error (500) error code.
        console.error("Doing /user/info error:", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object - This
        // is also an internal error return.
        response.status(500).send("Missing SchemaInfo");
        return;
      }

      // We got the object - return it in JSON format.
      console.log("SchemaInfo", info[0]);
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === "counts") {
    // In order to return the counts of all the collections we need to do an async
    // call to each collections. That is tricky to do so we use the async package
    // do the work.  We put the collections into array and use async.each to
    // do each .count() query.
    var collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];
    async.each(
      collections,
      function (col, done_callback) {
        col.collection.countDocuments({}, function (err, count) {
          col.count = count;
          done_callback(err);
        });
      },
      function (err) {
        if (err) {
          response.status(500).send(JSON.stringify(err));
        } else {
          var obj = {};
          for (var i = 0; i < collections.length; i++) {
            obj[collections[i].name] = collections[i].count;
          }
          response.end(JSON.stringify(obj));
          response.send(obj);
        }
      }
    );
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400) status.
    response.status(400).send("Bad param " + param);
  }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get("/user/list", function (request, response) {
  User.find().then((users) => {
    response.status(200).send(users);
  });
});

app.get("/photoById/:id", async function (request, response) {
  var id = request.params.id;
  let photo = await Photo.Photo.findById(id);
  response.send(photo);
});
/*
 * URL /user/:id - Return the information for User (id)
 */
app.get("/user/:id", async function (request, response) {
  var id = request.params.id;

  var user = await User.findById({ _id: id });

  if (user === null) {
    console.log("User with _id:" + id + " not found.");
    return response.status(400).send("Not found");
  }
  return response.status(200).send(user);
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get("/photosOfUser/:id", async function (request, response) {
  var id = request.params.id;
  var photos = await Photo.find({ user_id: id });
  if (photos.length === 0) {
    console.log("Photos for user with _id:" + id + " not found.");
    return response.status(400).send("Not found");
  }
  return response.status(200).send(photos);
});

// app.post("/comment", async function (res, req) {
//   const post = new Post({
//     comment: req.body.comment,
//     date_time: req.body.date_time,
//     content: req.body.content,
//   });
//   await Photo.res //await  .save();
//     .send(post);
// });

app.put("/commentsOfPhoto", async function (request, response) {
  const { userId, photoId } = request.query;

  await Photo.updateOne(
    { _id: photoId },
    {
      $push: {
        comments: {
          comment: request.body.data,
          data_time: Date.now(),
          user_id: userId,
        },
      },
    }
  );
  return response
    .status(200)
    .json({ message: "Successfully added comment", result: true });
});

var server = app.listen(3001, function () {
  var port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
