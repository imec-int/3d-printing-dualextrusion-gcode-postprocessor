# 3d-printing-dualextrusion-gcode-postprocessor

Simple script that draws a line between extruder switching


## KISSlicer setup

### Gcode

#### Prefix

    G21             ; set units to mm
    G90             ; absolute positioning

    T0              ; select extruder 0
    M109 S<WARM1>   ; warm to keepwarm temp and wait
    T1              ; select extruder 1
    M109 S<WARM2>   ; warm to keepwarm temp and wait

    M140 <BED>      ; warm bed

    G28             ; home

    M106            ; start fan

#### Select extruder

    ; Select new extruder
    T<EXT+0>
    ;[drawlines]

```;[drawlines]``` is the magic line that will be replaced by this script

#### Deselect Extruder

    G92 E0              ; reset extruder
    G1 E-10 F3000       ; retract filament


### Postfix

    G91                 ; Make coordinates relative
    G1 Z2 F5000         ; Move Z another 2mm up
    G90                 ; Use absolute coordinates again

    G28 ; home

    M107                ; Turn off fan
    T0
    M104 S0             ; Turn off heater of extruder
    T1
    M104 S0             ; Turn off heater of extruder
    M140 S0             ; Turn off bed heater
    M84                 ; disable steppers so they dont get hot during idling..

Make sure non of these codes contain coordinates.


## How to run this script

from the app-folder run:

    node parse.js ../path/to/model.gcode

or

    node parse.js ../path/to/model.gcode ../path/to/parsed_model.gcode

if you want to specify the output file


