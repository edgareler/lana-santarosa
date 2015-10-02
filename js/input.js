
var KEY = { D: 68, W: 87, A: 65, S:83, RIGHT:39, UP:38, LEFT:37, DOWN:40, Q:81, SPACE:32 };

var input = {
	p1Right: false,
	p1Up: false,
	p1Left: false,
	p1Down: false,
	p2Right: false,
	p2Up: false,
	p2Left: false,
	p2Down: false,
	quit: false,
	space: false
};

function press(evt) {
	var code = evt.keyCode;
	switch(code) {
		case KEY.D:
			input.p1Right = true;
			break;
		
		case KEY.W:
			input.p1Up = true;
			break;
		
		case KEY.A:
			input.p1Left = true;
			break;
		 
		case KEY.S:
			input.p1Down = true;
			break;
		
		case KEY.RIGHT:
			input.p2Right = true;
			break;
			
		case KEY.UP:
			input.p2Up = true;
			break;
			
		case KEY.LEFT:
			input.p2Left = true;
			break;
			
		case KEY.DOWN:
			input.p2Down = true;
			break;
		
		case KEY.Q:
			input.quit = true;
			break;
		
		case KEY.SPACE:
			input.space = true;
			break;
	}
}

function release(evt) {
	var code = evt.keyCode;
	switch(code) {
		case KEY.D:
			input.p1Right = false;
			break;
		
		case KEY.W:
			input.p1Up = false;
			break;
		
		case KEY.A:
			input.p1Left = false;
			break;
		 
		case KEY.S:
			input.p1Down = false;
			break;
		
		case KEY.RIGHT:
			input.p2Right = false;
			break;
			
		case KEY.UP:
			input.p2Up = false;
			break;
			
		case KEY.LEFT:
			input.p2Left = false;
			break;
			
		case KEY.DOWN:
			input.p2Down = false;
			break;
		
		case KEY.Q:
			input.quit = false;
			break;
		
		case KEY.SPACE:
			input.space = false;
			break;
	}
}