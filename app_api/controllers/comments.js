var mongoose = require('mongoose');
var Loc = mongoose.model('Poem');

var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

/* POST a new review, providing a poemid */
/* /api/poems/:poemid/comments */
module.exports.commentsCreate = function(req, res) {
  if (req.params.locationid) {
    Loc
      .findById(req.params.locationid)
      .select('comments')
      .exec(
        function(err, location) {
          if (err) {
            sendJSONresponse(res, 400, err);
          } else {
            doAddReview(req, res, location);
          }
        }
    );
  } else {
    sendJSONresponse(res, 404, {
      "message": "Not found, poemid required"
    });
  }
};


var doAddComment = function(req, res, poem) {
  if (!poem) {
    sendJSONresponse(res, 404, "poemid not found");
  } else {
    poem.comments.push({
      author: req.body.author,
      //rating: req.body.rating, //because we're not doing ratings
      reviewText: req.body.reviewText
    });
    poem.save(function(err, poem) {
      var thisComment;
      if (err) {
        sendJSONresponse(res, 400, err);
      } else {
        updateAverageRating(poem._id);//maybe take this line out?
        thisComment = poem.reviews[poem.reviews.length - 1];
        sendJSONresponse(res, 201, thisComment);
      }
    });
  }
};

// var updateAverageRating = function(locationid) {
//   console.log("Update rating average for", locationid);
//   Loc
//     .findById(locationid)
//     .select('reviews')
//     .exec(
//       function(err, location) {
//         if (!err) {
//           doSetAverageRating(location);
//         }
//       });
// };

// var doSetAverageRating = function(location) {
//   var i, reviewCount, ratingAverage, ratingTotal;
//   if (location.reviews && location.reviews.length > 0) {
//     reviewCount = location.reviews.length;
//     ratingTotal = 0;
//     for (i = 0; i < reviewCount; i++) {
//       ratingTotal = ratingTotal + location.reviews[i].rating;
//     }
//     ratingAverage = parseInt(ratingTotal / reviewCount, 10);
//     location.rating = ratingAverage;
//     location.save(function(err) {
//       if (err) {
//         console.log(err);
//       } else {
//         console.log("Average rating updated to", ratingAverage);
//       }
//     });
//   }
// };

module.exports.commentsUpdateOne = function(req, res) {
  if (!req.params.poemid || !req.params.commentid) {
    sendJSONresponse(res, 404, {
      "message": "Not found, poemid and commentid are both required"
    });
    return;
  }
  Loc
    .findById(req.params.poemid)
    .select('comments')
    .exec(
      function(err, poem) {
        var thisComment;
        if (!poem) {
          sendJSONresponse(res, 404, {
            "message": "poemid not found"
          });
          return;
        } else if (err) {
          sendJSONresponse(res, 400, err);
          return;
        }
        if (poem.comments && poem.comments.length > 0) {
          thisComment = poem.comments.id(req.params.commentid);
          if (!thisReview) {
            sendJSONresponse(res, 404, {
              "message": "commentid not found"
            });
          } else {
            thisComment.author = req.body.author;
            //thisReview.rating = req.body.rating; //because we're not doing ratings
            thisComment.commentText = req.body.commentText;
            poem.save(function(err, poem) {
              if (err) {
                sendJSONresponse(res, 404, err);
              } else {
                updateAverageRating(poem._id);
                sendJSONresponse(res, 200, thisComment);
              }
            });
          }
        } else {
          sendJSONresponse(res, 404, {
            "message": "No comment to update"
          });
        }
      }
  );
};

module.exports.commentsReadOne = function(req, res) {
  console.log("Getting single review");
  if (req.params && req.params.locationid && req.params.reviewid) {
    Loc
      .findById(req.params.locationid)
      .select('name reviews')
      .exec(
        function(err, location) {
          console.log(location);
          var response, review;
          if (!location) {
            sendJSONresponse(res, 404, {
              "message": "locationid not found"
            });
            return;
          } else if (err) {
            sendJSONresponse(res, 400, err);
            return;
          }
          if (location.reviews && location.reviews.length > 0) {
            review = location.reviews.id(req.params.reviewid);
            if (!review) {
              sendJSONresponse(res, 404, {
                "message": "reviewid not found"
              });
            } else {
              response = {
                location: {
                  name: location.name,
                  id: req.params.locationid
                },
                review: review
              };
              sendJSONresponse(res, 200, response);
            }
          } else {
            sendJSONresponse(res, 404, {
              "message": "No reviews found"
            });
          }
        }
    );
  } else {
    sendJSONresponse(res, 404, {
      "message": "Not found, locationid and reviewid are both required"
    });
  }
};

// app.delete('/api/locations/:locationid/reviews/:reviewid'
module.exports.commentsDeleteOne = function(req, res) {
  if (!req.params.locationid || !req.params.reviewid) {
    sendJSONresponse(res, 404, {
      "message": "Not found, locationid and reviewid are both required"
    });
    return;
  }
  Loc
    .findById(req.params.locationid)
    .select('reviews')
    .exec(
      function(err, location) {
        if (!location) {
          sendJSONresponse(res, 404, {
            "message": "locationid not found"
          });
          return;
        } else if (err) {
          sendJSONresponse(res, 400, err);
          return;
        }
        if (location.reviews && location.reviews.length > 0) {
          if (!location.reviews.id(req.params.reviewid)) {
            sendJSONresponse(res, 404, {
              "message": "reviewid not found"
            });
          } else {
            location.reviews.id(req.params.reviewid).remove();
            location.save(function(err) {
              if (err) {
                sendJSONresponse(res, 404, err);
              } else {
                updateAverageRating(location._id);
                sendJSONresponse(res, 204, null);
              }
            });
          }
        } else {
          sendJSONresponse(res, 404, {
            "message": "No review to delete"
          });
        }
      }
  );
};
