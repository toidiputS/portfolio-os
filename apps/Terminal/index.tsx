import React, { useState, useEffect, useRef } from 'react';
import { useKernel } from '../../store/kernel';

type OutputLine = {
    type: 'input' | 'output' | 'error';
    text: string;
};

const HELP_MESSAGE = `Available commands:
  help      - Show this help message.
  clear     - Clear the terminal screen.
  date      - Display the current date and time.
  emails    - List collected emails.
  matrix    - Enter the matrix.
  neofetch  - Display system information.`;

const NEOFETCH_OUTPUT = `
        ,.=:!!t3Z3z.,                -----------
       :i:i|i|i|i|i|i:iH3s.,           OS: Doors OS
      |i|i|i|i|i|i|i|i|i|i|iHS.        Kernel: 1.0.0-react
      ;i|i|i|i|i|i|i|i|i|i|i|i|i:       Uptime: just now
     .i|i|i|i|i|i|i|i|i|i|i|i|i|i:      Shell: term.sh
     :|i|i|i|i|i|i|i|i|i|i|i|i|i|i|      Resolution: 1920x1080
     ;i|i|i|i|i|i|i|i|i|i|i|i|i|i|i      DE: PortfolioWM
    :i|i|i|i|i|i|i|i|i|i|i|i|i|i|i|i     CPU: Your Brain
   .i|i|i|i|i|i|i|i|i|i|i|i|i|i|i|i|i    GPU: Imagination
   |i|i|i|i|i|i|i|i|i|i|i|i|i|i|i|i|i|   Memory: Probably fine
`;

const Terminal: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<OutputLine[]>([
        { type: 'output', text: 'Doors OS Terminal [Version 1.0.0]' },
        { type: 'output', text: '(c) Portfolio Corporation. All rights reserved.' },
        { type: 'output', text: 'Type "help" for a list of commands.' },
    ]);
    const inputRef = useRef<HTMLInputElement>(null);
    const endOfOutputRef = useRef<HTMLDivElement>(null);

    const collectedEmails = useKernel(state => state.collectedEmails);
    const toggleMatrixEffect = useKernel(state => state.toggleMatrixEffect);
    const closeWindow = useKernel(state => state.closeWindow);
    const windows = useKernel(state => state.windows);
    const thisWindow = windows.find(w => w.appId === 'terminal'); // A bit fragile, assumes one terminal

    const handleCommand = (command: string) => {
        const [cmd, ...args] = command.trim().split(' ');
        let cmdOutput: OutputLine[] = [];

        switch (cmd.toLowerCase()) {
            case 'help':
                cmdOutput = HELP_MESSAGE.split('\n').map(text => ({ type: 'output', text }));
                break;
            case 'clear':
                setOutput([]);
                return;
            case 'date':
                cmdOutput = [{ type: 'output', text: new Date().toString() }];
                break;
            case 'emails':
                if (collectedEmails.length > 0) {
                    cmdOutput = [
                        { type: 'output', text: 'Collected Emails:'},
                        ...collectedEmails.map(email => ({ type: 'output', text: `- ${email}` }))
                    ];
                } else {
                    cmdOutput = [{ type: 'output', text: 'No emails collected yet.' }];
                }
                break;
            case 'matrix':
                toggleMatrixEffect(true);
                if (thisWindow) {
                    closeWindow(thisWindow.id);
                }
                return;
            case 'neofetch':
                cmdOutput = NEOFETCH_OUTPUT.split('\n').map(text => ({ type: 'output', text }));
                break;
            case '':
                break;
            default:
                cmdOutput = [{ type: 'error', text: `command not found: ${cmd}` }];
                break;
        }

        setOutput(prev => [...prev, { type: 'input', text: `> ${command}` }, ...cmdOutput]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCommand(input);
        setInput('');
    };

    useEffect(() => {
        endOfOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [output]);

    return (
        <div 
            className="h-full w-full bg-black text-white font-mono p-2 text-sm overflow-y-auto"
            onClick={() => inputRef.current?.focus()}
        >
            {output.map((line, index) => (
                <div key={index} className={
                    line.type === 'error' ? 'text-red-500' : 
                    line.type === 'input' ? 'text-green-400' : ''
                }>
                   <pre>{line.text}</pre>
                </div>
            ))}
            <form onSubmit={handleSubmit} className="flex">
                <span className="text-green-400">&gt;</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-grow bg-transparent border-none outline-none pl-2"
                    autoFocus
                />
            </form>
            <div ref={endOfOutputRef} />
        </div>
    );
};

export default Terminal;