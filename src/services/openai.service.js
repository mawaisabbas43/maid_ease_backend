import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generateMaidProfile = async (maidData) => {
    const prompt = `
        Based on the following maid's details, create a professional and concise profile title (max 60 characters) and description (max 200 characters).
        The title should summarize the maid's skills and experience, and the description should highlight their expertise and location.
    
        Details:
        Full Name: ${maidData.full_name}
        Gender: ${maidData.gender}
        State: ${maidData.state}
        City: ${maidData.city}
        Address: ${maidData.current_address}
        Marital Status: ${maidData.marital_Status}
        Experience: ${maidData.experience} years
        Skills: ${maidData.skills}
    
        Return the result in **valid JSON format only**, without any extra text, markdown, or code block:
        {
          "profile_title": "Your generated title here",
          "profile_description": "Your generated description here"
        }
      `;

    try {
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant who creates professional maid profiles. Only return valid JSON, no extra text or formatting.'
                },
                {role: 'user', content: prompt},
            ],
            temperature: 0.7,
        });

        let responseText = chatCompletion.choices[0]?.message?.content?.trim();
        console.log(responseText);

        // Validate and sanitize the response
        try {
            const result = JSON.parse(responseText);
            console.log(result);
            return result;
        } catch (jsonError) {
            console.error('Invalid JSON format:', responseText);
            throw new Error('Failed to parse JSON response from OpenAI');
        }
    } catch (error) {
        console.error('Error generating profile:', error?.response?.data || error.message);
        throw new Error('Failed to generate profile title and description');
    }
};