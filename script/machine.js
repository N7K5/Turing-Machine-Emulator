$= '$';
LEFT= 'L';
RIGHT= 'R';


class Transition_function {
    constructor(current_state, read_alphabet, next_state, write_alphabet, move_direction) {
        this.current_state= current_state;
        this.read_alphabet= read_alphabet;
        this.next_state= next_state;
        this.write_alphabet= write_alphabet;
        let valid_left_move= [LEFT, 'left', 'Left', 'LEFT', 'l', 'L'];
        let valid_right_move= [RIGHT, 'right', 'Right', 'RIGHT', 'r', 'R'];
        if(valid_left_move.indexOf(move_direction)>-1) {
            move_direction= LEFT;
        } else if(valid_right_move.indexOf(move_direction)> -1) {
            move_direction= RIGHT;
        } else {
            throw ('--Invalid move direction- "'+move_direction+'"--');
        }
        this.move_direction= move_direction;
    }
}

class Turinng_Snap {
    constructor(states, starting_state) {
        this.states= states;
        this.tape= {
            0: $,
        };
        this.min_tape_index= 0;
        this.max_tape_index= 0;
        this.current_state= starting_state || states[0] || null;
        this.current_head_index= 0;
        this.transition_fn_array= [];
        this.final_states= []

        this.has_stopped= false;
        this.last_move_direction= undefined;

    }

    add_transition_data(current_state, read_alphabet, next_state, write_alphabet, move_direction) {
        this.transition_fn_array.push(new Transition_function(current_state, read_alphabet, next_state, write_alphabet, move_direction));
    }

    add_transition(t) {
        if(t instanceof Transition_function) {
            this.transition_fn_array.push(t);
        } else {
            throw `--send not transition obj. did you mean add_transition_data()?--`;
        }
    }

    halted() {
        if(this.has_stopped) return true;
        return false;
    }

    get_current_state() {
        return this.current_state || 'not_defined';
    }

    save() {
        this.remove_leading_blanks();
        let res= {
            'states': this.states,
            'tape': this.tape,
            'min_tape_index': this.min_tape_index,
            'max_tape_index': this.max_tape_index,
            'current_state': this.current_state,
            'current_head_index': this.current_head_index,
            'transition_fn_array': this.transition_fn_array,
            'final_states': this.final_states,
            'has_stopped': this.has_stopped,
            'last_move_direction': this.last_move_direction,
        }
        return btoa(JSON.stringify(res));
    }

    load(str) {
        let obj= null;
        try{
            str= atob(str);
            obj= JSON.parse(str);
        } catch(e) {
            alert('NOT a Valid string');
            throw('--JSON string to load is not valid--');
        }

        this.states= obj.states;
        this.tape= obj.tape;
        this.min_tape_index= obj.min_tape_index;
        this.max_tape_index= obj.max_tape_index;
        this.current_state= obj.current_state;
        this.current_head_index= obj.current_head_index;
        this.transition_fn_array= [];
        obj.transition_fn_array.forEach(t => {
            let tf= new Transition_function(t.current_state, t.read_alphabet, t.next_state, t.write_alphabet, t.move_direction);
            this.transition_fn_array.push(tf);
        })
        this.final_states= obj.final_states;
        this.has_stopped= obj.has_stopped;
        this.last_move_direction= obj.last_move_direction;

        return true;
    }

    set_tape(tape_arr, current_head_index) {
        if(!(tape_arr instanceof Array)) throw '--Setting tape needs an array--';
        if(current_head_index == undefined) current_head_index= -1;
        this.current_head_index= current_head_index;
        this.tape= {};
        this.tape[-1]= $;
        for(let i=0; i<tape_arr.length; i++) {
            this.tape[i]= tape_arr[i];
        }
        this.tape[tape_arr.length]= $;
        this.min_tape_index= -1;
        this.max_tape_index= tape_arr.length;
    }

    check_right_empty() {
        if(this.tape[this.current_head_index+1] == undefined) return true;
        return false;
    }
    check_left_empty() {
        if(this.tape[this.current_head_index-1] == undefined) return true;
        return false;
    }

    get_right_symbol() {
        if(this.check_right_empty()) {
            return $;
        }
        return this.tape[this.current_head_index+1];
    }

    get_left_symbol() {
        if(this.check_left_empty()) {
            return $;
        }
        return this.tape[this.current_head_index-1];
    }

    get_symbol_at_index(index) {
        return this.tape[index] || $;
    }

    get_current_symbol() {
        if(this.tape[this.current_head_index] == undefined) return $;
        return this.tape[this.current_head_index];
    }

    set_current_symbol(symbol) {
        this.tape[this.current_head_index]= symbol;
        if(this.current_head_index>this.max_tape_index) this.max_tape_index= this.current_head_index;
        if(this.current_head_index<this.min_tape_index) this.min_tape_index= this.current_head_index;
    }

    move_head_to_right(item_to_write) {
        if(item_to_write == undefined) throw '--Need a symbol to write in tape.--';
        this.set_current_symbol(item_to_write);
        this.current_head_index= this.current_head_index+1;
        if(this.current_head_index>this.max_tape_index) this.max_tape_index= this.current_head_index;
    }

    move_head_to_left(item_to_write) {
        if(item_to_write == undefined) throw '--Need a symbol to write in tape.--';
        this.set_current_symbol(item_to_write);
        this.current_head_index= this.current_head_index-1;
        if(this.current_head_index<this.min_tape_index) this.min_tape_index= this.current_head_index;
    }

    is_valid_state(state) {
        return this.states.indexOf(state) >= 0;
    }

    set_state(state) {
        if(this.is_valid_state(state)) this.current_state= state;
    }

    exec_single_transition_fn(g) {
        if(!this.current_state) throw '--Starting state not defined.--';
        if(! (g instanceof Transition_function)) {
            throw '--Invalid grammer caught.--';
        }
        if(! (this.current_state == g.current_state)) return false;
        if(! (this.get_current_symbol() == g.read_alphabet)) return false;

        if(g.move_direction == LEFT) {
            this.move_head_to_left(g.write_alphabet);
            this.current_state= g.next_state;
            return true;
        } else if(g.move_direction == RIGHT) {
            this.move_head_to_right(g.write_alphabet);
            this.current_state= g.next_state;
            return true;
        }
        throw `--exec_single_transition_fn didn't returned anything--`;
    }

    remove_leading_blanks() {
        for(let i=this.min_tape_index; i<this.max_tape_index; i++) {
            if(this.tape[i] == $) {
                if(i == this.current_head_index) break;
                delete this.tape[i];
                this.min_tape_index++;
            } else {
                break;
            }
        }

        for(let i=this.max_tape_index; i>this.min_tape_index; i--) {
            if(this.tape[i] == $) {
                if(i == this.current_head_index) break;
                delete this.tape[i];
                this.max_tape_index--;
            } else {
                break;
            }
        }
    }

    run_for_one_step() {
        if(this.has_stopped) return false;
        let index=0;
        for( ; index<this.transition_fn_array.length; index++) {
            let current_fn= this.transition_fn_array[index];
            let successfull_run= this.exec_single_transition_fn(current_fn);
            if(successfull_run) {
                this.last_move_direction= current_fn.move_direction;
                break;
            };
        }
        if(index == this.transition_fn_array.length){
            // no transaction happened; machine should be stopped.
            this.has_stopped= true;
        }
        if(this.final_states.indexOf(this.current_state) > -1) {
            this.has_stopped= true;
        }
        return true;
    }

    get_tape_data_arr(each_side_len) {
        if(!each_side_len) throw '--No tape length when fetching tape.--';
        each_side_len= Math.floor(each_side_len);
        let c= this.current_head_index;
        let res= [];
        for(let i= c-each_side_len; i<=c+each_side_len; i++) {
            res.push(this.get_symbol_at_index(i));
        }
        return res;
    }

    get_full_tape_as_arr() {
        let res= [];
        for(let i= this.min_tape_index; i<=this.max_tape_index; i++) {
            res.push(this.get_symbol_at_index(i));
        }
        // if(res[0] == $) res.shift();
        // if(res[res.length-1] == $) res.pop();
        return res;
    }
    get_cur_head_index_from_zero() {
        return this.current_head_index-this.min_tape_index;
    }

    print() {
        console.log(`\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~`)
        console.log('Current state: ', this.current_state);
        console.log('Min_tape_index: ', this.min_tape_index);
        console.log('Max_tape_index: ', this.max_tape_index);
        console.log('cur_tape_index: ', this.current_head_index);
        console.log('tape:');
        let tape_str= '--|';
        for(let i= this.min_tape_index-1; i<this.max_tape_index+2; i++) {
            if(i == this.current_head_index) tape_str+=' { ';
            tape_str+= this.get_symbol_at_index(i);
            if(i == this.current_head_index) tape_str+=' } ';
            tape_str+='|';
        }
        tape_str+='--'
        console.warn(tape_str);
        console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n`)
    }
    

}

