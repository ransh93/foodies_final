/**
*** A simple places comments widget with single finger scrolling for inner contents (made with CSS3)
*** Author: Kamil Czujowski
*** Made with ♥ 
*** https://github.com/kamilczujowski
*** Twitter: @kamilczujowski
*** Inspiration: http://dribbble.com/shots/1093954-Places-comments
**/

$(function() {
  $('a', '#poster').on(
    'click', 
    function(e){
        alert("here");
      $(this).toggleClass('act');
      e.preventDefault();
    }
  );
});