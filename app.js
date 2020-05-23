//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const mongoose = require("mongoose");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//                               >>todolistDB is the name of database  
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser:true, useUnifiedTopology:true});

//declaring a scheme
const itemsSchema={
  name:String
};

//seting-up a model     
const Item= mongoose.model("Item", itemsSchema);

//defining objects of that model
const item1=new Item({
  name:"Welcome to your todolist!"
});

const item2= new Item({
  name:"Hit the + button to add an item."
});

const item3= new Item({
  name:"<-- Hit this to delete an item."
});

//storing the objects in an array
const defaultItem=[item1, item2, item3];

const listSchema={
  name:String,
  item:[itemsSchema]
};

const List= mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({},function(e, foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItem, function(e){
        if(e){
          console.log(e);
        }else{
          console.log("Succesfully inserted in the DB.");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName= req.body.list;
  
   const newItem= Item({
    name: itemName
  });

    if(listName==="Today"){
     //i.e. when submit was pressed by button on root page 
      newItem.save();
      res.redirect("/");
    }else{
      //i.e. when submit was pressed by  on custom list page
      List.findOne({name:listName}, function(err, foundList){
        foundList.item.push(newItem);
        foundList.save();
        res.redirect("/"+ listName); 
      });
    }

 
});

app.post("/delete", function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName==="Today"){
    //when delete from root page 
    Item.findByIdAndRemove(checkedItemId,function(e){
      //this find gives us an array in return
      if(e){
        console.log(e);
      }else{
        console.log("Deleted successfully!"); 
      }
    })
    res.redirect("/");
  
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{item:{checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+ listName);
      }
    });
  }
 
});
//route parameter
app.get("/:customListName", function(req,res){
const customListName= _.capitalize(req.params.customListName);

List.findOne({name:customListName}, function(err, foundList){
// this find will give an object(as only one object from the array) in return
if(!err){//when no error
  if(!foundList){ //but list not found
  //create a new list
  const list= new List({
    name:customListName,
    item: defaultItem
  });
  list.save();
  res.redirect("/"+ customListName);
  }else{ //no error and list found
  //show the existing list
  res.render("list",{listTitle: foundList.name, newListItems: foundList.item} )
  }
}else{
  console.log("There's some error!");
}
})



});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
