import { useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { getTokenOrRefresh } from './token_util';
import { Send28Filled, BookOpenMicrophone28Filled, SlideMicrophone32Filled } from "@fluentui/react-icons";
import { ResultReason, CancellationDetails, CancellationReason, SpeechConfig, AudioConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';

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
            switch (result.reason) {
                case ResultReason.RecognizedSpeech:
                    setQuestion(result.text);
                    setPlaceholder(placeholder);
                    //sendQuestion();
                    break;

                case ResultReason.NoMatch:
                    setPlaceholder('Speech was not recognized');
                    break;

                case ResultReason.Canceled:
                    const cancellation = CancellationDetails.fromResult(result);
                    console.log(`Speech to text cancelled:  Reason: ${cancellation.reason}`);
                    setPlaceholder('Speech to text was cancelled')

                    if (cancellation.reason == CancellationReason.Error)
                        console.error(`Speech to text cancelled upon error:  Code: ${cancellation.ErrorCode}:  Details: ${cancellation.errorDetails}:  Are the speech resource key and region values set?`);

                default:
                    console.log(`Speech to text cancelled:  Reason: ${result.reason}:  Error Details: ${result.errorDetails}:  Result: ${result}`);
                    setPlaceholder('Speech to text was cancelled')
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
