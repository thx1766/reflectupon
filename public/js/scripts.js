$(document).ready(function(){
  $.post("/api/thought", { name: "test", description: "woah" }, function(data) {
    console.log(data);
  },"json");
});
