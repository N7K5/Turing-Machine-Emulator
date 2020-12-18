let canvas= undefined;
let ctx= undefined;
let cell_size= null;
let shown_no_of_cells= null;
let head_x_val= null;

let animation_speed= 5;

let draw_loop_running= false;

function make_canvas() {
    container= document.getElementById('canvas_container');
    canvas= document.createElement('canvas');
    canvas.id= 'canvas';
    canvas.width= document.getElementById('non_hover').offsetWidth;
    canvas.height= window.innerHeight/2;
    // canvas.style.border= "5px solid #000";
    container.innerHTML= '';
    container.appendChild(canvas);
    ctx= canvas.getContext('2d');

    cell_size= canvas.width/15>50? Math.floor(canvas.width/15) : 50;
    shown_no_of_cells= Math.ceil(canvas.width/cell_size);
    head_x_val= ((parseInt(shown_no_of_cells/2)*cell_size)- cell_size*0.5);

    ctx.font = Math.floor(cell_size/2)+"px Arial"
    ctx.textAlign = "center";

    let b= document.createElement('button');
    b.id='run_for_a_step';
    b.innerText= 'Run one step';
    b.className="button_run";
    container.appendChild(b);

    b= document.createElement('button');
    b.id='run';
    b.innerText= 'Run';
    b.className="button_run";
    container.appendChild(b);

    b= document.createElement('button');
    b.id='stop';
    b.innerText= 'Stop';
    b.className="button_stop";
    b.style.display= 'none';
    container.appendChild(b);


    document.getElementById('run_for_a_step').addEventListener('click', ()=> {
        animate_for_one_step();
    }, false);

    document.getElementById('run').addEventListener('click', ()=> {
        run_continuously();
    }, false);

    document.getElementById('stop').addEventListener('click', () => {
        stop_run_continuously();
    }, false);
}

let tm= null;
function create_machine() {
    tm= new Turinng_Snap(available_states);
    available_transactions.forEach(t => {
        tm.add_transition(t);
    });
    tm.set_tape(ip_tape);
    ip_tape=[];

    draw_loop_running= true;
    // draw_loop();
}



function draw_tape(shift){
    if(!shift) shift= 0;
    
    let tape= tm.get_tape_data_arr(shown_no_of_cells/2+2);

    for(let i=0; i<tape.length; i++) {
        let x= ((i*cell_size)- cell_size*2.5) + shift;
        let y= canvas.height/2;
        ctx.beginPath();
        ctx.fillStyle = "#e6ffff";
        if(tape[i] != $) ctx.fillRect(x, y, cell_size, cell_size);
        ctx.rect(x, y, cell_size, cell_size);
        ctx.fillStyle = "#000000";
        ctx.fillText(tape[i], x+cell_size/2, y+cell_size*.66);
        // ctx.strokeText(i, x+cell_size/2, y+cell_size/1.2);
        ctx.stroke();
    }
}


function draw_head(shift) {
    if(!shift) shift= 0;

    let y= canvas.height/2 - cell_size + shift;

    ctx.beginPath();
    ctx.rect(head_x_val, y, cell_size, cell_size);
    ctx.moveTo(head_x_val, y+cell_size);
    ctx.lineTo(head_x_val+cell_size/2, y+cell_size*1.5);
    ctx.lineTo(head_x_val+cell_size, y+cell_size);
    ctx.stroke();
}


let head_shift= 0;
let tape_shift= 0;
let single_animation_running= false;
let current_task= 0; // 0-> initiate, 1-> head_down, 2->flash, 3->head_up, 4->move_tape, 5->end;
let animating_now= false;
function animate_for_one_step() {
    if(current_task== 0) {
        animating_now= true;
        head_shift= 0;
        tape_shift= 0;
        single_animation_running= true;
        current_task++;
    }
    else if(current_task == 1) {
        head_shift+=2*animation_speed;
        if(head_shift >= cell_size) current_task++;
    }
    else if(current_task == 2) {
        let running= tm.run_for_one_step();
        if(!running) stop_run_continuously();
        if(tm.last_move_direction == LEFT) {
            tape_shift= -cell_size;
        } else if(tm.last_move_direction == RIGHT) {
            tape_shift= cell_size;
        } else {
            console.warn('Move dir not found');
        }
        if(tm.halted()) tape_shift= 0;
        show_tape_in_def();
        show_cur_state_in_def();
        current_task++;
    }
    else if(current_task == 3) {
        head_shift-=2*animation_speed;
        if(head_shift <= 0) {
            current_task++;
        }
    }
    else if(current_task == 4) {
        if(tm.halted()) {
            tape_shift= 0;
            current_task= 5;
        }
        else {
            if(tm.last_move_direction == LEFT) {
                tape_shift+=1*animation_speed;
            } else if(tm.last_move_direction == RIGHT) {
                tape_shift-=1*animation_speed;
            } else {
                console.warn('no move_dir');
            }
            if(tape_shift<animation_speed && tape_shift>-animation_speed){
                tape_shift= 0;
                current_task++;
            }
        }
    }
    else if(current_task == 5) {
        single_animation_running= false;
        current_task= 0;
        animating_now= false;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    draw_tape(tape_shift);
    draw_head(head_shift);

    if(single_animation_running) requestAnimationFrame(animate_for_one_step);
}




let continuous_run_interval= null;
function run_continuously() {

    continuous_run_interval= setInterval(() => {
        if(!animating_now) animate_for_one_step();
    }, 100);

    document.getElementById('run').style.display= 'none';
    document.getElementById('stop').style.display= 'inline-block';

}

function stop_run_continuously() {
    clearInterval(continuous_run_interval);
    if(!document.getElementById('canvas')) return;
    document.getElementById('run').style.display= 'inline-block';
    document.getElementById('stop').style.display= 'none';
}






// let tape_shift= 0;
// function draw_loop() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // tape_shift= (tape_shift+1)%cell_size;
//     draw_tape(tape_shift);

//     draw_head(tape_shift)

//     if(draw_loop_running) requestAnimationFrame(draw_loop);
// }