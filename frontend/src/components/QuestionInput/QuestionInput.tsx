import { useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { getTokenOrRefresh } from './token_util';
import { Send28Filled, BookOpenMicrophone28Filled, SlideMicrophone32Filled } from "@fluentui/react-icons";
import { ResultReason, SpeechConfig, AudioConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';

import styles from "./QuestionInput.module.css";
interface Props {
    onSend: (question: string) => void;
    disabled: boolean;
    speechToTextDisabled: boolean;
    placeholder?: string;
    clearOnSend?: boolean;
}

export const QuestionInput = ({ onSend, disabled, speechToTextDisabled, placeholder = "", clearOnSend }: Props) => {
    const [currPlaceholder, setPlaceholder] = useState<string> (placeholder);
    const [listening,       setListening]   = useState<boolean>(false);
    const [question,        setQuestion]    = useState<string> ("");

    const sendQuestion = () => {
        if (disabled || !question.trim()) {
            return;
        }

        onSend(question);

        if (clearOnSend) {
            setQuestion("");
        }
    };

    const sttFromMic = async () => {
        if (speechToTextDisabled) {
            return;
        }

        setListening(true)

        const tokenObj = await getTokenOrRefresh();
        const speechConfig = SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = tokenObj.speechRecognitionLanguage;
        
        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        const userLanguage = navigator.language;
        let reiniciar_text = '';
        if (userLanguage.startsWith('pt')) {
          reiniciar_text = 'Pode falar usando seu microfone...';
        } else if (userLanguage.startsWith('es')) {
          reiniciar_text = 'Puedes hablar usando su micrófono...';
        } else {
          reiniciar_text = 'Speak a question or other prompt.  Listening ...';
        }

        setPlaceholder(reiniciar_text);

        recognizer.recognizeOnceAsync(result => {
            if (result.reason === ResultReason.RecognizedSpeech) {
                setQuestion(result.text);
                setPlaceholder(placeholder);
                //sendQuestion();
            } else {
                console.warn(`Speech to text cancelled:  ${result.reason}:  ${result.errorDetails}:  ${result}`);
                setPlaceholder(`Speech to text cancelled:  ${result.reason}`);
            }

            setListening(false)
        });
    };

    const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
        if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            sendQuestion();
        }
    };

    const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        if (!newValue) {
            setQuestion("");
        } else if (newValue.length <= 1000) {
            setQuestion(newValue);
        }

        if (currPlaceholder != placeholder) {
            setPlaceholder(placeholder);
        }
    };

    const sendQuestionDisabled = disabled || !question.trim();

    return (
        <Stack horizontal className={styles.questionInputContainer}>
            <TextField
                className={styles.questionInputTextArea}
                placeholder={currPlaceholder}
                multiline
                resizable={false}
                borderless
                value={question}
                onChange={onQuestionChange}
                onKeyDown={onEnterPress}
            />
            <div className={styles.questionInputButtonsContainer}>
                <div
                    className={`${styles.questionInputSendButton} ${sendQuestionDisabled ? styles.questionInputSendButtonDisabled : ""}`}
                    aria-label="Boton hacer preguntas"
                    onClick={sendQuestion}
                >
                    <Send28Filled primaryFill="rgba(115, 118, 225, 1)" />
                </div>
                <div
                    className={`${styles.questionInputSendButton} ${speechToTextDisabled || listening ? styles.questionInputSendButtonDisabled : ""}`}
                    aria-label="Boton hablar"
                    onClick={sttFromMic}
                >
                    <SlideMicrophone32Filled primaryFill="rgba(115, 118, 225, 1)" />
                </div>
            </div>
        </Stack>
    );
};
