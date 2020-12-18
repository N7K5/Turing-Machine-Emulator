
let available_states= []

let current_state_manualy_defined= false;

document.getElementById('add_state').addEventListener('click', () => {
    let raw_data_arr= document.getElementById('ip_states').value.split(/,| /);
    raw_data_arr.forEach(d => {
        d= d.trim();
        if(/^[a-zA-Z0-9]+$/.test(d)) {
            if(available_states.indexOf(d)<0)   
                available_states.push(d);
        }
    });


    document.getElementById('states').innerHTML='';
    if(available_states.length == 0) {
        document.getElementById('states').innerHTML='No states defined.';
        document.getElementById('remove_state').style.display= 'none';
    } else {
        document.getElementById('remove_state').style.display= 'inline-block';
        if(!current_state_manualy_defined)
            document.getElementById('config_current_state').innerHTML= 'Current state: '+ available_states[0];
    }
    available_states.forEach(d => {
        document.getElementById('states').innerHTML+='<span class="states_item">'+d+'</span>';
    });
    raw_data_arr= document.getElementById('ip_states').value= '';

}, false);


let available_transactions= []

document.getElementById('add_transition').addEventListener('click', () => {
    let vals_arr= document.getElementById('ip_rules').value.split(/,|>|=>|->|~| /);
    tmp_vals_arr= []
    vals_arr.forEach(e => {
        e= e.trim();
        if(/^[a-zA-Z0-9_-]+$/.test(e)) {
            tmp_vals_arr.push(e);
        }
        else if(e == $) {
            tmp_vals_arr.push(e);
        }
    });
    vals_arr= tmp_vals_arr;

    if(available_states.indexOf(vals_arr[0])<0 || available_states.indexOf(vals_arr[2])<0) {
        show_error('Invalid states in transition function..<br />define states first');
        console.error('Invalid states in transition function..');
        return;
    }
    if(vals_arr.length != 5 ) {
        console.log(vals_arr)
        show_error('Invalid transition function.. <bt />Look at the format.');
        console.error('Invalid transition function..');
        return;
    }

    let cur_state= vals_arr[0];
    let read_symbol= vals_arr[1];
    let next_state= vals_arr[2];
    let write_sumbol= vals_arr[3];
    let move_dir= vals_arr[4];

    let t= null;
    try {
        t= new Transition_function(cur_state, read_symbol, next_state, write_sumbol, move_dir);
    } catch(e) {
        show_error('Unable to make transition function..')
        console.error(e);
        return;
    }

    for(let i=0; i<available_transactions.length; i++) {
        let tns= available_transactions[i];
        if(tns.current_state == cur_state && tns.read_alphabet == read_symbol) {
            console.warn('Move already exist, removing...');
            available_transactions.splice(i, 1);
        }
    }

    available_transactions.push(t);

    document.getElementById('transitions').innerHTML='';
    if(available_transactions.length == 0) {
        document.getElementById('transitions').innerHTML='No transitions defined.';
        document.getElementById('remove_transition').style.display= 'none';
    } else {
        document.getElementById('remove_transition').style.display= 'inline-block';
    }
    available_transactions.forEach(t => {
        str= '';
        str+= t.current_state;
        str+= ', ';
        str+= t.read_alphabet;
        str+= ' => ';
        str+= t.next_state;
        str+=', ';
        str+= t.write_alphabet;
        str+= ', ';
        str+= t.move_direction == LEFT ? 'Left': 'Right';
        document.getElementById('transitions').innerHTML+= '<div class="transition_item">'+str+'</div>';
    });

}, false);

let ip_tape= [];

document.getElementById('set_tape').addEventListener('click', () => {
    ip_tape= [];
    let raw_tape_data= document.getElementById('ip_tape').value;
    raw_tape_data= raw_tape_data.split(/,| /);
    raw_tape_data.forEach(d => {
        d= d.trim();
        if(d.length>0 && /^[a-zA-Z0-9]+$/.test(d)) {
            ip_tape.push(d);
        }
        else if(d == $) {
            ip_tape.push(d);
        }
    });

    let tape_str= '<a class="tape_item_cur">'+$+'</a>';
    ip_tape.forEach(e => {
        if( e == $) tape_str+=', <a class="tape_item_blank">'+e+'</a>';
        else tape_str+=', <a class="tape_item">'+e+'</a>';
    });
    // tape_str+= ', '+$;
    document.getElementById('tape').innerHTML= tape_str;
    document.getElementById('ip_tape').value= '';

}, false);


document.getElementById('create_machine').addEventListener('click', ()=> {
    make_canvas();
    create_machine();
    draw_tape();
    draw_head();
    show_tape_in_def();
    show_cur_state_in_def();

    document.getElementById('hover_container').style.top= '-100%';
    document.getElementById('non_hover').style.filter= 'blur(0px)';

}, false);

document.getElementById('close_create_machine_overlay').addEventListener('click', () => {
    document.getElementById('hover_container').style.top= '-100%';
    document.getElementById('non_hover').style.filter= 'blur(0px)';
})


document.getElementById('define_machine').addEventListener('click', () => {
    stop_run_continuously();
    
    document.getElementById('hover_container').style.animationName= 'drop_container_from_top';
    document.getElementById('hover_container').style.animationDuration= '1s';
    // document.getElementById('hover_container').style.animation= 'drop_container_from_top 1s';
    document.getElementById('hover_container').style.top= '10%';
    
    setTimeout(() => {
        document.getElementById('hover_container').style.animationName= '';
        document.getElementById('hover_container').style.animationDuration= '';
    }, 2000)
    document.getElementById('non_hover').style.filter= 'blur(3px)';
}, false);


function show_tape_in_def() {

    let el_tape= document.getElementById('tape');
    if(!tm) {
        el_tape.innerHTML= 'Machine not build yet';
        return;
    }

    let data= tm.get_full_tape_as_arr();
    let head_index= tm.get_cur_head_index_from_zero();
    // console.log(data);
    let str= '';
    for(let i=0; i<data.length; i++) {
        if(i == head_index) str+='<a class="tape_item_cur">'+data[i]+'</a>, ';
        else if(data[i] == $) str+='<a class="tape_item_blank">'+data[i]+'</a>, ';
        else str+='<a class="tape_item">'+data[i]+'</a>, ';
    }
    str+='';
    el_tape.innerHTML= str;
}

function show_cur_state_in_def() {

    let el_tape= document.getElementById('config_current_state');
    if(!tm) {
        el_tape.innerHTML= 'Current state: <a class="cur_state"> None </a>';
        return;
    }

    let state= tm.get_current_state();
    el_tape.innerHTML= 'Current state: <a class="cur_state">'+state+'</a>';
}



let error_timeout= null;
function show_error(error_str) {
    stop_run_continuously()
    if(!error_str) error_str= 'Some error occured';
    let el_error= document.getElementById('error');
    el_error.style.animationName= '';
    el_error.style.webkitAnimationDirection= 'normal';
    document.getElementById('error_content').innerHTML= error_str;

    setTimeout(() => {
        el_error.style.animationName= 'show_error_from_top';
        el_error.style.top= '20%';
        document.getElementById('non_hover').style.filter= 'blur(4px)';
        document.getElementById('hover_container').style.filter= 'blur(4px)';
        document.getElementById('machine_def').style.filter= 'blur(4px)';
    }, 50);
    
    clearTimeout(error_timeout);
    error_timeout= setTimeout(() => {
        hide_error();
    }, 5000);
}

function hide_error() {
    stop_run_continuously()
    let el_error= document.getElementById('error');
    el_error.style.animationName= '';
    el_error.style.webkitAnimationDirection= 'reverse';
    clearTimeout(error_timeout);

    setTimeout(() => {
        el_error.style.animationName= 'show_error_from_top';
        el_error.style.top= '-100%';
        document.getElementById('non_hover').style.filter= 'blur(0px)';
        document.getElementById('hover_container').style.filter= 'blur(0px)';
        document.getElementById('machine_def').style.filter= 'blur(0px)';
    }, 50);
    
}

document.getElementById('error_x').addEventListener('click', hide_error, false);









function show_popup(popup_html, callback_fn) {
    stop_run_continuously();
    if(!popup_html) popup_html= '<div>Some error occured</div>';
    let el_error= document.getElementById('popup');
    el_error.style.animationName= '';
    el_error.style.webkitAnimationDirection= 'normal';
    document.getElementById('popup_content').innerHTML= popup_html;

    setTimeout(() => {
        el_error.style.animationName= 'show_error_from_top';
        el_error.style.top= '20%';
        document.getElementById('non_hover').style.filter= 'blur(4px)';
        document.getElementById('hover_container').style.filter= 'blur(4px)';
        document.getElementById('machine_def').style.filter= 'blur(4px)';
        if(callback_fn) callback_fn();
    }, 50);
}

function hide_popup() {
    stop_run_continuously();
    let el_error= document.getElementById('popup');
    el_error.style.animationName= '';
    el_error.style.webkitAnimationDirection= 'reverse';

    setTimeout(() => {
        el_error.style.animationName= 'show_error_from_top';
        el_error.style.top= '-100%';
        document.getElementById('non_hover').style.filter= 'blur(0px)';
        document.getElementById('hover_container').style.filter= 'blur(0px)';
        document.getElementById('machine_def').style.filter= 'blur(0px)';
    }, 50);
    
}

document.getElementById('popup_x').addEventListener('click', hide_popup, false);

document.getElementById('save_machine').addEventListener('click', () => {
    let m_state= tm? tm.save() : null;
    stop_run_continuously();

    if(m_state == null) {
        show_error('Define a machine first to save...');
        return;
    }

    str= `<h3> The machine as string </h3> <textarea rows='5' id='popup_textarea'>${m_state}</textarea><br />`;
    str+=`<button id='copy_string' class='button_run'> copy_string </button>`;

    show_popup(str, () => {
        document.getElementById('copy_string').addEventListener('click', () => {
            let copyText = document.getElementById("popup_textarea");
            copyText.select();
            copyText.setSelectionRange(0, 99999)
            document.execCommand("copy");
            alert("Copied The machine to the clipboard ");
        }, false);
    });

    
}, false);


function load_string_as_machine(str) {
    make_canvas();

    if(!tm) tm= new Turinng_Snap([]);
    tm.load(str);
    draw_loop_running= true;

    available_states= [];
    available_transactions= [];
    tm.states.forEach(e => available_states.push(e));
    tm.transition_fn_array.forEach(e => available_transactions.push(e));



    document.getElementById('states').innerHTML='';
    if(available_states.length == 0) {
        document.getElementById('states').innerHTML='No states defined.';
        document.getElementById('remove_state').style.display= 'none';
    } else {
        document.getElementById('remove_state').style.display= 'inline-block';
        if(!current_state_manualy_defined)
            document.getElementById('config_current_state').innerHTML= 'Current state: '+ available_states[0];
    }
    available_states.forEach(d => {
        document.getElementById('states').innerHTML+='<span class="states_item">'+d+'</span>';
    });


    document.getElementById('transitions').innerHTML='';
    if(available_transactions.length == 0) {
        document.getElementById('transitions').innerHTML='No transitions defined.';
        document.getElementById('remove_transition').style.display= 'none';
    } else {
        document.getElementById('remove_transition').style.display= 'inline-block';
    }
    available_transactions.forEach(t => {
        str= '';
        str+= t.current_state;
        str+= ', ';
        str+= t.read_alphabet;
        str+= ' => ';
        str+= t.next_state;
        str+=', ';
        str+= t.write_alphabet;
        str+= ', ';
        str+= t.move_direction == LEFT ? 'Left': 'Right';
        document.getElementById('transitions').innerHTML+= '<div class="transition_item">'+str+'</div>';
    });

    
    draw_tape();
    draw_head();
    show_tape_in_def();
    show_cur_state_in_def();

    hide_popup();
}


document.getElementById('load_machine').addEventListener('click', () => {
    stop_run_continuously();

    let str= `<h3> The machine as string </h3> <textarea rows='5' id='popup_textarea'></textarea><br />`;
    str+=`<button id='load_string' class='button_run'> Load </button>`;

    show_popup(str, () => {
        document.getElementById('load_string').addEventListener('click', () => {
            let value = document.getElementById("popup_textarea").value;

            load_string_as_machine(value);

        }, false);
    });

    
}, false);




document.getElementById('load_examples').addEventListener('click', () => {
    let str= `<h3>Choose a machine</h3><br />`;
    example_machines.forEach(machine => {
        str+= `<a id='${machine.name}' class='example_items'>${machine.name}</a>`;
    })
    show_popup(str, () => {
        let examples= document.getElementsByClassName('example_items');
        for(let i=0; i<examples.length; i++) {
            let current_element= examples[i];
            current_element.addEventListener('click', e => {
                let target_id= e.target.id;
                let machine_str= '';
                example_machines.forEach(machine => {if(machine.name == target_id) machine_str= machine.data })
                load_string_as_machine(machine_str);
            },false)
        }
    });
}, false);

