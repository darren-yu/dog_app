$(function(){

	$(".deleteDog").on("click", function(event){
		// alert("don't drop me");
		event.preventDefault();
		var thisDeleteButton = $(this);

		if(confirm("Removing your doggy, Are you sure?")) {
			// alert("its gone");
			$.ajax({
				url: "/dogs/" + $(this).data("dropdog"),
				type: "DELETE",
				success:function (result){
					thisDeleteButton.closest("tr").fadeOut("slow", function() {
						$(this).remove();
					})
				}
			})
		}
		else {
			alert("Phew, that was a close one!");
		}
	});

});