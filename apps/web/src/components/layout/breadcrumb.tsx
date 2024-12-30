import React from 'react';
import { useLocation, Link, useMatches } from 'react-router-dom';
import { theme } from 'antd';
import { RightOutlined } from '@ant-design/icons';

export default function Breadcrumb() {
    let matches = useMatches();
    const { token } = theme.useToken()

    let crumbs = matches
        // first get rid of any matches that don't have handle and crumb
        .filter((match) => Boolean((match.handle as any)?.crumb))
        // now map them into an array of elements, passing the loader
        // data to each one
        .map((match) => (match.handle as any).crumb(match.data));

    return (
        <ol className='flex items-center space-x-2 text-gray-600'>
            {crumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                    <li className={`inline-flex items-center `}
                        style={{
                            color: (index === crumbs.length - 1) ? token.colorPrimaryText : token.colorTextSecondary,
                            fontWeight: (index === crumbs.length - 1) ? "bold" : "normal",
                        }}
                    >
                        {crumb}
                    </li>
                    {index < crumbs.length - 1 && (
                        <li className='mx-2'>
                            <RightOutlined></RightOutlined>
                        </li>
                    )}
                </React.Fragment>
            ))}
        </ol>
    );
}
