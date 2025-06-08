import React from 'react';

const spinnerStyle = {
    display: 'inline-block',
    width: '64px',
    height: '64px',
};

const circleStyle = {
    boxSizing: 'border-box',
    display: 'block',
    position: 'absolute',
    width: '51px',
    height: '51px',
    margin: '6px',
    border: '6px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
    borderColor: '#3498db transparent transparent transparent',
};

const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '120px',
};

const textStyle = {
    marginTop: '16px',
    color: '#3498db',
    fontWeight: '500',
    fontSize: '1.1rem',
    letterSpacing: '0.05em',
};

const LoadingComponent = ({ text = 'Loading...' }) => (
    <section style={wrapperStyle}>
        <span style={{ ...spinnerStyle, position: 'relative' }}>
            <span style={{ ...circleStyle, animationDelay: '0s' }} />
            <span style={{ ...circleStyle, animationDelay: '-0.45s' }} />
            <span style={{ ...circleStyle, animationDelay: '-0.3s' }} />
            <span style={{ ...circleStyle, animationDelay: '-0.15s' }} />
        </span>
        <p style={textStyle}>{text}</p>
        <style>
            {`
                @keyframes spin {
                    0% { transform: rotate(0deg);}
                    100% { transform: rotate(360deg);}
                }
            `}
        </style>
    </section>
);

export default LoadingComponent;