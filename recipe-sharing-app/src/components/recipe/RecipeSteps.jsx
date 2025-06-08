import React from 'react';

const RecipeSteps = ({ steps }) => {
    return (
        <div className="recipe-steps">
            <h2>Cooking Steps</h2>
            <ol>
                {steps.map((step, index) => (
                    <li key={index}>
                        {step}
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default RecipeSteps;