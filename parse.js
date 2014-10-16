#!/usr/bin/env node


var fs = require('fs');
var Decimal = require('decimal');
var path = require('path');


var bed_y_value = 200; //205
var min_distance_between_nozzle_and_object = 35; // closest distance the nozzle can come before touching the object
var y = 1; //starting y value to draw lines
var lineseperator = '\r\n';


if(!process.argv[2])
	return console.log('Usage: node parse.js inputfile [outputfile]')


var inputfile = process.argv[2];
var outputfile = process.argv[3];

if(!outputfile){
	var ext = path.extname(inputfile);
	var basename = path.basename(inputfile, ext);
	var dirname = path.dirname(inputfile);
	outputfile = path.join(dirname, basename + '_samyfied' + ext);
}


fs.readFile(inputfile, 'utf8', function (err, data) {
	if (err) return console.log(err);

	var lines = data.split(lineseperator);


	// READ ALL LINES AND GET SOME NUMBERS TO WORK WITH:
	var y_increment = 0.6;
	var nr_of_lines_to_draw = 0;
	var y_distance_to_move_object = 0;

	// find heighest and lowest Y value:
	var heighest_y_value = 0;
	var lowest_y_value = bed_y_value;

	for (var i = 0; i < lines.length; i++) {
		var match = lines[i].match('Y([0-9]*\.[0-9]+|[0-9]+)');
		if(match && match[1]){
			var value = parseFloat(match[1]);
			if(value > heighest_y_value)
				heighest_y_value = value;

			if(value < lowest_y_value)
				lowest_y_value = value;
		}

		if(lines[i] == ';[drawlines]')
			nr_of_lines_to_draw++

	}

	console.log('heighest_y_value: ' + heighest_y_value);
	console.log('lowest_y_value: ' + lowest_y_value);

	if(bed_y_value > heighest_y_value)
		y_distance_to_move_object = Decimal(bed_y_value).add(-heighest_y_value).toNumber();

	console.log('y_distance_to_move_object: ' + y_distance_to_move_object);

	// find free space:
	var object_y_size = heighest_y_value-lowest_y_value;
	console.log('object_y_size', object_y_size);

	var free_y_space = bed_y_value-object_y_size-min_distance_between_nozzle_and_object;

	console.log('free_y_space ', free_y_space);

	// calculate optimal distance between lines:
	y_increment = free_y_space/nr_of_lines_to_draw;
	y_increment = 2*y_increment;
	y_increment = Math.floor(y_increment*100)/100;

	console.log('calculated y_increment: ' + y_increment);



	// MODIFY GCODE:

	var linecounter = 0;
	for (var i = 0; i < lines.length; i++) {

		// move object by y_distance_to_move_object
		var match = lines[i].match('Y([0-9]*\.[0-9]+|[0-9]+)');
		if(match && match[1]){
			var oldvalue = parseFloat(match[1]);
			var replace_string = 'Y'+match[1];
			var newvalue =  Decimal(oldvalue).add(y_distance_to_move_object).toNumber();
			lines[i] = lines[i].replace(replace_string, 'Y'+newvalue);
		}

		// insert extra gcode when switching extruder:
		if(lines[i] == ';[drawlines]'){

			var y_line1 = y;
			var y_line2 = Decimal(y).add('0.3').toNumber();
			console.log(y_line1);

			var x_start = 20.0;
			var x_end = 90.0;
			if(linecounter%2 != 0){
				x_start = 200.0;
				x_end = 130.0;
			}

			var drawlinesCode = lineseperator + ';*** SAMS gcode optimizer ***' + lineseperator;
			drawlinesCode += ';extruding a bit' + lineseperator;

			drawlinesCode += 'G1 X'+x_start+' Y'+y_line1+' Z0.3 F3000.0' + lineseperator; // move to start

			drawlinesCode += 'G92 E0 ' + lineseperator;
			drawlinesCode += 'G1 E10 F100' + lineseperator;
			drawlinesCode += 'G92 E0' + lineseperator;

			drawlinesCode += ';drawing 2 lines' + lineseperator;

			drawlinesCode += 'G1 X'+x_end+' Y'+y_line1+' Z0.3 F1500.0 E7' + lineseperator; // draw line 1
			drawlinesCode += 'G1 X'+x_end+' Y'+y_line2+' Z0.3 F3000.0' + lineseperator; // move to side
			drawlinesCode += 'G1 X'+x_start+' Y'+y_line2+' Z0.3 F1500.0 E14' + lineseperator; // draw line 2

			drawlinesCode += 'G92 E0' + lineseperator;
			drawlinesCode += 'G1 E-1 F3000' + lineseperator; // retract filament a little before starting
			drawlinesCode += 'G92 E0' + lineseperator;


			drawlinesCode += ';*** END SAMS gcode optimizer ***' + lineseperator;

			if(linecounter%2 != 0){
				y = Decimal(y).add(y_increment).toNumber();
			}

			lines[i] = drawlinesCode;

			linecounter++;
		}
	};


	var newdata = lines.join(lineseperator);

	fs.writeFile(outputfile, newdata, function (err) {
	    if(err) {
	        console.log(err);
	    } else {
	        console.log("Done!");
	        console.log("File saved to " + outputfile);
	    }
	});
});